import { describe, it, expect, beforeAll } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  issueGalleryUnlockToken,
  verifyGalleryUnlockToken,
} from "@/lib/gallery-unlock-session";
import { deriveEventSchedule, paidRetentionExpiresAt } from "@/lib/event-schedule";
import { getPlan } from "@/lib/plans";
import { markPaymentPaid } from "@/lib/billing/activate-payment";
import { parseFlittPayload } from "@/lib/billing/flitt-adapter";

describe("production readiness phase A", () => {
  beforeAll(async () => {
    process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
    await prisma.$connect();
  });

  it("rejects forged gallery cookie value 1", () => {
    expect(verifyGalleryUnlockToken("1", "evt", 0)).toBe(false);
    expect(verifyGalleryUnlockToken(undefined, "evt", 0)).toBe(false);
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
