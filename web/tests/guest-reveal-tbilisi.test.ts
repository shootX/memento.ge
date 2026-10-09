import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/push-server", () => ({
  notifyBatchedUploads: async () => {},
}));
import { tbilisiWallTimeToUtc, isGalleryRevealed } from "@/lib/tbilisi-time";
import { readFileSync } from "fs";
import { deriveEventSchedule } from "@/lib/event-schedule";
import { getPlan } from "@/lib/plans";

describe("guest upload vs gallery reveal", () => {
  it("allows upload before revealAt when upload window is open", async () => {
    process.env.E2E_RATE_LIMIT_FREE = "1";
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("@/app/api/guest/[slug]/upload/route");
    const slug = `reveal-${Date.now()}`;
    const eventDate = new Date();
    const derived = deriveEventSchedule(eventDate, getPlan("starter"));
    const revealAt = tbilisiWallTimeToUtc(2030, 1, 1, 0, 0, 0);
    const event = await prisma.event.create({
      data: {
        coupleNames: "Reveal",
        eventDate,
        guestSlug: slug,
        hostToken: `reveal-host-${Date.now()}`.padEnd(32, "x"),
        slideshowToken: `reveal-slide-${Date.now()}`.padEnd(32, "y"),
        isPaid: true,
        paidAt: new Date(),
        expiresAt: derived.galleryExpiresAt,
        uploadOpensAt: derived.uploadOpensAt,
        uploadClosesAt: derived.uploadClosesAt,
        galleryExpiresAt: derived.galleryExpiresAt,
        disposableEnabled: true,
        revealAt,
      },
    });
    const jpeg = readFileSync(`${process.cwd()}/tests/fixtures/tiny.jpg`);
    const form = new FormData();
    form.append("file", new Blob([jpeg], { type: "image/jpeg" }), "a.jpg");
    form.append("guestKey", "g1");
    const res = await POST(
      new Request(`http://local/api/guest/${slug}/upload`, { method: "POST", body: form }),
      { params: Promise.resolve({ slug }) },
    );
    expect(res.status).toBe(200);

    await prisma.media.deleteMany({ where: { eventId: event.id } });
    await prisma.event.delete({ where: { id: event.id } });
  });

  it("isGalleryRevealed aligns with UTC instant for midnight Tbilisi", () => {
    const revealAt = tbilisiWallTimeToUtc(2026, 10, 17, 0, 0, 0);
    expect(isGalleryRevealed(revealAt, true, new Date("2026-10-16T19:59:59.000Z"))).toBe(false);
  });
});
