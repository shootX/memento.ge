import { describe, it, expect, vi } from "vitest";
import { isCronAuthorized } from "@/lib/cron-auth";
import { POST as cronPost } from "@/app/api/cron/email/route";
import {
  tbilisiWallTimeToUtc,
  isGalleryRevealed,
  isEventExpired,
} from "@/lib/tbilisi-time";
import { verifyTbcPublicCallbackAuth, tbcWebhookHmacHex } from "@/lib/billing/tbc-webhook-auth";
import { logBogDeprecatedCallbackPath, resetBogDeprecatedLogForTests } from "@/lib/bog-callback-deprecation";
import { GET as healthGet } from "@/app/api/health/route";
import { POST as stubPost } from "@/app/api/payment/stub/route";
import { normalizeClientUploadKey } from "@/lib/guest-upload-idempotency";

describe("AUD-004 cron auth", () => {
  it("refuses when CRON_SECRET is empty", () => {
    delete process.env.CRON_SECRET;
    expect(isCronAuthorized(new Request("http://x", { method: "POST" }))).toBe(false);
  });

  it("route returns 401 without secret", async () => {
    delete process.env.CRON_SECRET;
    const res = await cronPost(new Request("http://x", { method: "POST" }));
    expect(res.status).toBe(401);
  });
});

describe("AUD-005 payment stub", () => {
  it("returns 410 Gone", async () => {
    const res = await stubPost(
      new Request("http://x", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId: "x", planTier: "starter" }),
      }),
    );
    expect(res.status).toBe(410);
  });
});

describe("AUD-016 TBC HMAC when secret set", () => {
  it("requires signature header when TBC_WEBHOOK_SECRET is set", () => {
    process.env.TBC_WEBHOOK_SECRET = "hmac-test-secret";
    delete process.env.TBC_WEBHOOK_HMAC_SECRET;
    process.env.NODE_ENV = "production";
    delete process.env.PAYMENT_MOCK;
    const raw = JSON.stringify({ PaymentId: "p1" });
    expect(verifyTbcPublicCallbackAuth(new Request("http://x", { method: "POST", body: raw }), raw)).toBe(
      false,
    );
    const sig = tbcWebhookHmacHex(raw, "hmac-test-secret");
    expect(
      verifyTbcPublicCallbackAuth(
        new Request("http://x", {
          method: "POST",
          body: raw,
          headers: { "x-tbc-signature": sig },
        }),
        raw,
      ),
    ).toBe(true);
    delete process.env.TBC_WEBHOOK_SECRET;
  });
});

describe("AUD-014 BOG deprecated log", () => {
  it("logs once", () => {
    resetBogDeprecatedLogForTests();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logBogDeprecatedCallbackPath();
    logBogDeprecatedCallbackPath();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe("health endpoint", () => {
  it("returns ok and version without secrets", async () => {
    const res = await healthGet();
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.ok).toBe(true);
    expect(json.db).toBe("up");
    expect(json.version).toBeTruthy();
    expect(json).not.toHaveProperty("DATABASE_URL");
  });
});

describe("Tbilisi timezone Q9", () => {
  it("revealAt at midnight Tbilisi opens at 20:00 UTC same calendar eve", () => {
    const revealAt = tbilisiWallTimeToUtc(2026, 10, 17, 0, 0, 0);
    expect(isGalleryRevealed(revealAt, true, new Date("2026-10-16T19:59:59.000Z"))).toBe(false);
    expect(isGalleryRevealed(revealAt, true, new Date("2026-10-16T20:00:00.000Z"))).toBe(true);
  });

  it("expiresAt instant comparison", () => {
    const exp = tbilisiWallTimeToUtc(2026, 12, 31, 23, 59, 59);
    expect(isEventExpired(exp, new Date(exp.getTime() - 1000))).toBe(false);
    expect(isEventExpired(exp, new Date(exp.getTime() + 1000))).toBe(true);
  });
});

describe("client upload key", () => {
  it("normalizes safe keys", () => {
    expect(normalizeClientUploadKey("abc-123_")).toBe("abc-123_");
    expect(normalizeClientUploadKey("../bad")).toBeNull();
  });
});
describe("guest upload idempotency integration", () => {
  it("records and finds client key per event", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { recordUploadClientKey, findExistingUploadByClientKey } = await import(
      "@/lib/guest-upload-idempotency",
    );
    const event = await prisma.event.create({
      data: {
        coupleNames: "Dedupe",
        eventDate: new Date(),
        guestSlug: `dedupe-${Date.now()}`,
        hostToken: `dedupe-host-${Date.now()}`.padEnd(32, "x"),
        slideshowToken: `dedupe-slide-${Date.now()}`.padEnd(32, "y"),
        isPaid: true,
      },
    });
    const media = await prisma.media.create({
      data: {
        id: crypto.randomUUID(),
        eventId: event.id,
        storageKey: `events/${event.id}/dedupe.jpg`,
        mimeType: "image/jpeg",
        size: 10,
      },
    });
    const key = `client-key-${Date.now()}`;
    await recordUploadClientKey(event.id, key, media.id);
    const found = await findExistingUploadByClientKey(event.id, key);
    expect(found?.mediaId).toBe(media.id);

    await prisma.guestUploadIdempotency.deleteMany({ where: { eventId: event.id } });
    await prisma.media.delete({ where: { id: media.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });
});
