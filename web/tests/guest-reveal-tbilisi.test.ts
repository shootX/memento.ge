import { describe, it, expect } from "vitest";
import { tbilisiWallTimeToUtc, isGalleryRevealed } from "@/lib/tbilisi-time";
import { readFileSync } from "fs";

describe("guest upload revealAt Tbilisi midnight", () => {
  it("returns 403 GALLERY_NOT_REVEALED before reveal instant", async () => {
    process.env.E2E_RATE_LIMIT_FREE = "1";
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("@/app/api/guest/[slug]/upload/route");
    const { computeExpiresAt, getPlan } = await import("@/lib/plans");
    const slug = `reveal-${Date.now()}`;
    const revealAt = tbilisiWallTimeToUtc(2030, 1, 1, 0, 0, 0);
    const event = await prisma.event.create({
      data: {
        coupleNames: "Reveal",
        eventDate: new Date(),
        guestSlug: slug,
        hostToken: `reveal-host-${Date.now()}`.padEnd(32, "x"),
        slideshowToken: `reveal-slide-${Date.now()}`.padEnd(32, "y"),
        isPaid: true,
        paidAt: new Date(),
        expiresAt: computeExpiresAt(getPlan("starter")),
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
    expect(res.status).toBe(403);
    const j = (await res.json()) as { code?: string };
    expect(j.code).toBe("GALLERY_NOT_REVEALED");

    await prisma.event.delete({ where: { id: event.id } });
  });

  it("isGalleryRevealed aligns with UTC instant for midnight Tbilisi", () => {
    const revealAt = tbilisiWallTimeToUtc(2026, 10, 17, 0, 0, 0);
    expect(isGalleryRevealed(revealAt, true, new Date("2026-10-16T19:59:59.000Z"))).toBe(false);
  });
});
