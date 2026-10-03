import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync } from "fs";
import { resolveUploadIdempotencyKey } from "@/lib/guest-upload-idempotency";

describe("upload idempotency AUD-023", () => {
  it("accepts Idempotency-Key header", () => {
    const form = new FormData();
    const req = new Request("http://x", {
      headers: { "Idempotency-Key": "mobile-photo-uuid-123" },
    });
    expect(resolveUploadIdempotencyKey(req, form)).toBe("mobile-photo-uuid-123");
  });

  it("double POST with same key creates one Media row", async () => {
    process.env.E2E_RATE_LIMIT_FREE = "1";
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("@/app/api/guest/[slug]/upload/route");
    const { computeExpiresAt, getPlan } = await import("@/lib/plans");
    const slug = `idem-${Date.now()}`;
    const event = await prisma.event.create({
      data: {
        coupleNames: "Idem",
        eventDate: new Date(),
        guestSlug: slug,
        hostToken: `idem-host-${Date.now()}`.padEnd(32, "x"),
        slideshowToken: `idem-slide-${Date.now()}`.padEnd(32, "y"),
        isPaid: true,
        paidAt: new Date(),
        expiresAt: computeExpiresAt(getPlan("starter")),
      },
    });
    const jpeg = readFileSync(`${process.cwd()}/tests/fixtures/tiny.jpg`);
    const key = `idem-key-${Date.now()}`;
    const makeReq = () => {
      const form = new FormData();
      form.append("file", new Blob([jpeg], { type: "image/jpeg" }), "a.jpg");
      form.append("guestKey", "g1");
      return new Request(`http://local/api/guest/${slug}/upload`, {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: form,
      });
    };
    const r1 = await POST(makeReq(), { params: Promise.resolve({ slug }) });
    const r2 = await POST(makeReq(), { params: Promise.resolve({ slug }) });
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const body2 = (await r2.json()) as { duplicate?: boolean };
    expect(body2.duplicate).toBe(true);
    const mediaCount = await prisma.media.count({ where: { eventId: event.id } });
    expect(mediaCount).toBe(1);

    await prisma.guestUploadIdempotency.deleteMany({ where: { eventId: event.id } });
    await prisma.media.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });
});
