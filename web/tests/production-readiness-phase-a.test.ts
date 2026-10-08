import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  issueGalleryUnlockToken,
  verifyGalleryUnlockToken,
} from "@/lib/gallery-unlock-session";
import {
  deriveEventSchedule,
  paidRetentionExpiresAt,
  isWithinUploadWindow,
} from "@/lib/event-schedule";
import { getPlan } from "@/lib/plans";
import {
  claimWebhookEvent,
  markPaymentPaid,
  webhookIdempotencyKey,
} from "@/lib/billing/activate-payment";
import { parseFlittPayload } from "@/lib/billing/flitt-adapter";
import { bigintToNumber } from "@/lib/bytes-json";

describe("production readiness phase A", () => {
  beforeAll(async () => {
    process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
    await prisma.$connect();
  });

  it("rejects forged gallery cookie value 1", () => {
    expect(verifyGalleryUnlockToken("1", "evt", 0)).toBe(false);
    expect(verifyGalleryUnlockToken(undefined, "evt", 0)).toBe(false);
  });

  it("rejects expired gallery unlock token", () => {
    const t = issueGalleryUnlockToken("evt-exp", 1, -10);
    expect(verifyGalleryUnlockToken(t, "evt-exp", 1)).toBe(false);
  });

  it("invalidates unlock token when galleryAccessVersion bumps", () => {
    const t = issueGalleryUnlockToken("evt-a", 1);
    expect(verifyGalleryUnlockToken(t, "evt-a", 1)).toBe(true);
    expect(verifyGalleryUnlockToken(t, "evt-a", 2)).toBe(false);
  });

  it("paid activation expires from event date not payment instant", async () => {
    const plan = getPlan("starter");
    const eventDate = new Date("2030-06-15T12:00:00.000Z");
    const expires = paidRetentionExpiresAt(eventDate, plan);
    const derived = deriveEventSchedule(eventDate, plan);
    expect(expires.getTime()).toBe(derived.galleryExpiresAt.getTime());
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });

  it("markPaymentPaid rejects amount mismatch on real postgres", async () => {
    const event = await prisma.event.create({
      data: {
        guestSlug: `prd-${Date.now()}`,
        hostToken: `host-${Date.now()}-token-xxxxxxxx`,
        slideshowToken: `slide-${Date.now()}-token-xxxx`,
        coupleNames: "Test",
        eventDate: new Date("2030-01-01"),
      },
    });
    const payment = await prisma.payment.create({
      data: {
        eventId: event.id,
        amountGel: 49,
        currency: "GEL",
        provider: "flitt",
        externalId: `ext-${Date.now()}`,
        status: "pending",
      },
    });
    await expect(
      markPaymentPaid(payment.externalId!, event.id, {
        amountGel: 1,
        currency: "GEL",
        provider: "flitt",
      }),
    ).rejects.toThrow(/PAYMENT_AMOUNT_MISMATCH/);
  });

  it("flitt webhook rejects when secret missing", async () => {
    const prev = process.env.FLITT_SECRET_KEY;
    delete process.env.FLITT_SECRET_KEY;
    delete process.env.FLITT_MERCHANT_ID;
    const res = await parseFlittPayload('{"order_status":"approved"}');
    expect(res.ok).toBe(false);
    process.env.FLITT_SECRET_KEY = prev;
  });

  it("markPaymentPaid is idempotent on duplicate success webhook", async () => {
    const event = await prisma.event.create({
      data: {
        guestSlug: `dup-${Date.now()}`,
        hostToken: `host-${Date.now()}-dup-token-xxxxxxxx`,
        slideshowToken: `slide-${Date.now()}-dup-token-xxxx`,
        coupleNames: "Dup",
        eventDate: new Date("2030-03-01"),
      },
    });
    const externalId = `ext-dup-${Date.now()}`;
    const payment = await prisma.payment.create({
      data: {
        eventId: event.id,
        amountGel: 49,
        currency: "GEL",
        provider: "flitt",
        externalId,
        status: "pending",
      },
    });
    const expected = { amountGel: 49, currency: "GEL", provider: "flitt" };
    await markPaymentPaid(externalId, event.id, expected);
    await markPaymentPaid(externalId, event.id, expected);
    const after = await prisma.payment.findUnique({ where: { id: payment.id } });
    expect(after?.status).toBe("paid");
    const ev = await prisma.event.findUnique({ where: { id: event.id } });
    expect(ev?.isPaid).toBe(true);
  });

  it("webhook idempotency blocks duplicate claim", async () => {
    const raw = `{"probe":${Date.now()}}`;
    const key = webhookIdempotencyKey("flitt", raw);
    expect(await claimWebhookEvent("flitt", key)).toBe(true);
    expect(await claimWebhookEvent("flitt", key)).toBe(false);
  });

  it("early paid event blocks upload before event-day window", async () => {
    const plan = getPlan("starter");
    const future = new Date();
    future.setUTCFullYear(future.getUTCFullYear() + 2);
    const derived = deriveEventSchedule(future, plan);
    expect(isWithinUploadWindow(new Date(), derived.uploadOpensAt, derived.uploadClosesAt)).toBe(
      false,
    );
    const event = await prisma.event.create({
      data: {
        guestSlug: `early-${Date.now()}`,
        hostToken: `host-${Date.now()}-early-token-xxxxxx`,
        slideshowToken: `slide-${Date.now()}-early-token-xxxx`,
        coupleNames: "Early",
        eventDate: future,
        isPaid: true,
        paidAt: new Date(),
        uploadOpensAt: derived.uploadOpensAt,
        uploadClosesAt: derived.uploadClosesAt,
        galleryExpiresAt: derived.galleryExpiresAt,
      },
    });
    const { eventAllowsUpload } = await import("@/lib/auth");
    expect(eventAllowsUpload(event)).toBe(false);
  });

  it("serializes Event.totalBytes above 2GiB without precision loss in API layer", async () => {
    const over2g = 2 * 1024 * 1024 * 1024 + 512;
    const event = await prisma.event.create({
      data: {
        guestSlug: `big-${Date.now()}`,
        hostToken: `host-${Date.now()}-big-token-xxxxxxx`,
        slideshowToken: `slide-${Date.now()}-big-token-xxxxxx`,
        coupleNames: "Big",
        eventDate: new Date(),
        totalBytes: BigInt(over2g),
      },
    });
    const row = await prisma.event.findUnique({ where: { id: event.id } });
    expect(bigintToNumber(row!.totalBytes)).toBe(over2g);
    const planStarter = getPlan("starter");
    expect(Number(row!.totalBytes) > planStarter.maxTotalBytes).toBe(true);
    const planPremium = getPlan("premium");
    const nearPremium = BigInt(planPremium.maxTotalBytes - 1024);
    const heavy = await prisma.event.create({
      data: {
        guestSlug: `lim-${Date.now()}`,
        hostToken: `host-${Date.now()}-lim-token-xxxxxxx`,
        slideshowToken: `slide-${Date.now()}-lim-token-xxxxxx`,
        coupleNames: "Lim",
        eventDate: new Date(),
        totalBytes: nearPremium,
      },
    });
    expect(Number(heavy.totalBytes)).toBe(planPremium.maxTotalBytes - 1024);
    expect(Number(heavy.totalBytes) < planPremium.maxTotalBytes).toBe(true);
  });

  it("gallery password change bumps access version", async () => {
    const hash = await bcrypt.hash("secret1234", 4);
    const event = await prisma.event.create({
      data: {
        guestSlug: `gal-${Date.now()}`,
        hostToken: `host-${Date.now()}-gal-token-xxxxxx`,
        slideshowToken: `sld-${Date.now()}-gal-token-xxxxxx`,
        coupleNames: "G",
        eventDate: new Date(),
        galleryPasswordHash: hash,
        galleryAccessVersion: 3,
        publicGallery: true,
      },
    });
    const oldTok = issueGalleryUnlockToken(event.id, 3);
    expect(verifyGalleryUnlockToken(oldTok, event.id, 3)).toBe(true);
    await prisma.event.update({
      where: { id: event.id },
      data: { galleryAccessVersion: { increment: 1 } },
    });
    expect(verifyGalleryUnlockToken(oldTok, event.id, 4)).toBe(false);
  });
});
