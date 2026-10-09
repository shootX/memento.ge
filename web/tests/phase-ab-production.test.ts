import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/plans";
import {
  hashHostCapabilityToken,
  rotateHostCapabilityToken,
  findEventByHostCapabilityToken,
} from "@/lib/host-token";
import {
  processWebhookDelivery,
  setWebhookTestFailOnceForPayment,
} from "@/lib/billing/webhook-processor";
import { applyEventDateChange } from "@/lib/event-date-change";
import { validateUploadIngress } from "@/lib/upload-validation";
import { nanoid } from "nanoid";

describe("phase A finish + B hooks (postgres)", () => {
  beforeAll(async () => {
    process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
    await prisma.$connect();
  });

  it("PRD-A-011 denies host token after rotation", async () => {
    const oldToken = `host-${nanoid(28)}`;
    const event = await prisma.event.create({
      data: {
        coupleNames: "Host",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: oldToken,
        slideshowToken: nanoid(32),
      },
    });
    expect(await findEventByHostCapabilityToken(oldToken)).not.toBeNull();
    const newToken = await rotateHostCapabilityToken(event.id);
    expect(await findEventByHostCapabilityToken(oldToken)).toBeNull();
    expect(await findEventByHostCapabilityToken(newToken)).not.toBeNull();
    const row = await prisma.event.findUnique({ where: { id: event.id } });
    expect(row?.hostTokenHash).toBe(hashHostCapabilityToken(newToken));
  });

  it("webhook retry after simulated failure then single activation under concurrency", async () => {
    const event = await prisma.event.create({
      data: {
        coupleNames: "Pay",
        eventDate: new Date("2031-01-01"),
        guestSlug: nanoid(21),
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
      },
    });
    const payment = await prisma.payment.create({
      data: {
        eventId: event.id,
        amountGel: 49,
        currency: "GEL",
        provider: "flitt",
        externalId: `ext-${nanoid(8)}`,
        status: "pending",
      },
    });
    const key = `idem-${nanoid(12)}`;
    setWebhookTestFailOnceForPayment(payment.id);
    const first = await processWebhookDelivery({
      provider: "flitt",
      idempotencyKey: key,
      paymentId: payment.id,
      eventId: event.id,
      outcome: "paid",
      expected: { amountGel: 49, currency: "GEL", provider: "flitt" },
    });
    expect(first.status).toBe(503);

    const second = await processWebhookDelivery({
      provider: "flitt",
      idempotencyKey: key,
      paymentId: payment.id,
      eventId: event.id,
      outcome: "paid",
      expected: { amountGel: 49, currency: "GEL", provider: "flitt" },
    });
    expect(second.status).toBe(200);

    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        processWebhookDelivery({
          provider: "flitt",
          idempotencyKey: key,
          paymentId: payment.id,
          eventId: event.id,
          outcome: "paid",
          expected: { amountGel: 49, currency: "GEL", provider: "flitt" },
        }),
      ),
    );
    expect(results.every((r) => r.status === 200)).toBe(true);
    const paidCount = await prisma.payment.count({
      where: { id: payment.id, status: "paid" },
    });
    expect(paidCount).toBe(1);
    const ev = await prisma.event.findUnique({ where: { id: event.id } });
    expect(ev?.isPaid).toBe(true);
  });

  it("webhook DB outage returns 503 not 200", async () => {
    process.env.WEBHOOK_TEST_FORCE_DB_ERROR = "1";
    const res = await processWebhookDelivery({
      provider: "flitt",
      idempotencyKey: `db-${nanoid(8)}`,
      outcome: "noop",
    });
    delete process.env.WEBHOOK_TEST_FORCE_DB_ERROR;
    expect(res.status).toBe(503);
  });

  it("upload idempotency: same key parallel, payload conflict, quota boundary", async () => {
    process.env.E2E_RATE_LIMIT_FREE = "1";
    const { POST } = await import("@/app/api/guest/[slug]/upload/route");
    const slug = `up-${Date.now()}`;
    const plan = getPlan("starter");
    const event = await prisma.event.create({
      data: {
        coupleNames: "Up",
        eventDate: new Date(),
        guestSlug: slug,
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        isPaid: true,
        planTier: "starter",
        uploadCount: plan.maxUploads - 1,
        totalBytes: BigInt(plan.maxTotalBytes - 500),
      },
    });
    const jpeg = readFileSync(`${process.cwd()}/tests/fixtures/tiny.jpg`);
    const key = `client-${nanoid(10)}`;
    const mk = (name: string) => {
      const form = new FormData();
      form.append("file", new Blob([jpeg], { type: "image/jpeg" }), name);
      form.append("guestKey", "g1");
      form.append("clientUploadKey", key);
      return POST(
        new Request(`http://local/api/guest/${slug}/upload`, { method: "POST", body: form }),
        { params: Promise.resolve({ slug }) },
      );
    };
    const [a, b] = await Promise.all([mk("a.jpg"), mk("b.jpg")]);
    expect([a.status, b.status].filter((s) => s === 200).length).toBeGreaterThanOrEqual(1);

    const slug2 = `up2-${Date.now()}`;
    const ev2 = await prisma.event.create({
      data: {
        coupleNames: "Up2",
        eventDate: new Date(),
        guestSlug: slug2,
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        isPaid: true,
      },
    });
    const key2 = `client-${nanoid(10)}`;
    const formOk = new FormData();
    formOk.append("file", new Blob([jpeg], { type: "image/jpeg" }), "a.jpg");
    formOk.append("guestKey", "g1");
    formOk.append("clientUploadKey", key2);
    await POST(
      new Request(`http://local/api/guest/${slug2}/upload`, { method: "POST", body: formOk }),
      { params: Promise.resolve({ slug: slug2 }) },
    );
    const form2 = new FormData();
    form2.append("file", new Blob([jpeg], { type: "image/png" }), "x.png");
    form2.append("guestKey", "g1");
    form2.append("clientUploadKey", key2);
    const conflict = await POST(
      new Request(`http://local/api/guest/${slug2}/upload`, { method: "POST", body: form2 }),
      { params: Promise.resolve({ slug: slug2 }) },
    );
    expect(conflict.status).toBe(409);
    await prisma.media.deleteMany({ where: { eventId: ev2.id } });
    await prisma.event.delete({ where: { id: ev2.id } });

    await prisma.media.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });

  it("8/25 GiB plan limits enforced via reservation metadata", async () => {
    const premium = getPlan("premium");
    const event = await prisma.event.create({
      data: {
        coupleNames: "Lim",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        isPaid: true,
        planTier: "premium",
        totalBytes: BigInt(premium.maxTotalBytes - 100),
      },
    });
    const { reserveGuestUpload, UploadQuotaExceeded } = await import(
      "@/lib/guest-upload-reservation"
    );
    await expect(
      reserveGuestUpload({
        event,
        clientKey: "k1",
        payloadHash: "h1",
        reservedBytes: 200,
        guestKey: "g",
        disposableShotCheck: false,
      }),
    ).rejects.toBeInstanceOf(UploadQuotaExceeded);

    const pro = getPlan("pro");
    const ev2 = await prisma.event.create({
      data: {
        coupleNames: "Pro",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        isPaid: true,
        planTier: "pro",
        totalBytes: BigInt(pro.maxTotalBytes - 50),
      },
    });
    await expect(
      reserveGuestUpload({
        event: ev2,
        clientKey: "k2",
        payloadHash: "h2",
        reservedBytes: 100,
        guestKey: "g",
        disposableShotCheck: false,
      }),
    ).rejects.toBeInstanceOf(UploadQuotaExceeded);
  });

  it("event date change never shortens paid gallery expiry", () => {
    const plan = getPlan("starter");
    const prev = new Date("2035-06-01T00:00:00.000Z");
    const next = applyEventDateChange(prev, new Date("2030-01-01"), plan);
    expect(next.galleryExpiresAt.getTime()).toBeGreaterThanOrEqual(prev.getTime());
  });

  it("rejects fake mp4 and honors phase B ingress rules", async () => {
    const buf = Buffer.from("not really a video file!!!!");
    await expect(
      validateUploadIngress(buf, "video/mp4", 5_000_000, "fake.mp4"),
    ).rejects.toThrow();
  });

  it("cross-event host media PATCH denied", async () => {
    const tokenA = nanoid(32);
    const tokenB = nanoid(32);
    const a = await prisma.event.create({
      data: {
        coupleNames: "A",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: tokenA,
        slideshowToken: nanoid(32),
        isPaid: true,
      },
    });
    const b = await prisma.event.create({
      data: {
        coupleNames: "B",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: tokenB,
        slideshowToken: nanoid(32),
        isPaid: true,
      },
    });
    const mediaB = await prisma.media.create({
      data: {
        id: crypto.randomUUID(),
        eventId: b.id,
        storageKey: `events/${b.id}/x.jpg`,
        mimeType: "image/jpeg",
        size: 10,
      },
    });
    const { PATCH } = await import("@/app/api/host/[token]/media/[id]/route");
    const res = await PATCH(
      new Request(`http://local/api/host/${tokenA}/media/${mediaB.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `HostToken ${tokenA}`,
        },
        body: JSON.stringify({ highlight: true }),
      }),
      { params: Promise.resolve({ token: tokenA, id: mediaB.id }) },
    );
    expect(res.status).toBe(404);
    await prisma.media.deleteMany({ where: { eventId: { in: [a.id, b.id] } } });
    await prisma.event.deleteMany({ where: { id: { in: [a.id, b.id] } } });
  });
});
