import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { assertMediaBelongsToEvent } from "@/lib/auth";
import { nanoid } from "nanoid";

describe("multi-tenant isolation", () => {
  let eventA: string;
  let eventB: string;
  let mediaA: string;
  let partnerA: string;
  let partnerB: string;

  beforeAll(async () => {
    const a = await prisma.event.create({
      data: {
        coupleNames: "A",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        isPaid: true,
      },
    });
    const b = await prisma.event.create({
      data: {
        coupleNames: "B",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: nanoid(32),
        slideshowToken: nanoid(32),
        isPaid: true,
      },
    });
    eventA = a.id;
    eventB = b.id;
    const m = await prisma.media.create({
      data: {
        id: crypto.randomUUID(),
        eventId: eventA,
        storageKey: `events/${eventA}/${nanoid(8)}.jpg`,
        mimeType: "image/jpeg",
        size: 100,
      },
    });
    mediaA = m.id;

    const pa = await prisma.partnerOrg.create({
      data: { name: "Partner A", slug: `pa-${nanoid(8)}` },
    });
    const pb = await prisma.partnerOrg.create({
      data: { name: "Partner B", slug: `pb-${nanoid(8)}` },
    });
    partnerA = pa.id;
    partnerB = pb.id;
  });

  afterAll(async () => {
    await prisma.media.deleteMany({ where: { eventId: { in: [eventA, eventB] } } });
    await prisma.event.deleteMany({ where: { id: { in: [eventA, eventB] } } });
    await prisma.partnerOrg.deleteMany({ where: { id: { in: [partnerA, partnerB] } } });
    await prisma.$disconnect();
  });

  it("prevents cross-event media access (IDOR)", async () => {
    const ok = await assertMediaBelongsToEvent(mediaA, eventA);
    const bad = await assertMediaBelongsToEvent(mediaA, eventB);
    expect(ok).not.toBeNull();
    expect(bad).toBeNull();
  });

  it("partner orgs are distinct", async () => {
    const eventsForA = await prisma.event.findMany({ where: { partnerOrgId: partnerA } });
    const eventsForB = await prisma.event.findMany({ where: { partnerOrgId: partnerB } });
    expect(eventsForA.every((e) => e.partnerOrgId === partnerA)).toBe(true);
    expect(eventsForB.every((e) => e.partnerOrgId === partnerB)).toBe(true);
  });
});
