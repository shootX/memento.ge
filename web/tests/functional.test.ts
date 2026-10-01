import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getEventByGuestSlug, getEventByHostToken, eventAllowsUpload } from "@/lib/auth";
import { computeExpiresAt, getPlan } from "@/lib/plans";
import fs from "fs/promises";

describe("event lifecycle", () => {
  let guestSlug: string;
  let hostToken: string;
  let slideshowToken: string;
  let eventId: string;

  beforeAll(async () => {
    guestSlug = "testguestslug123456";
    hostToken = "testhosttoken123456789012345678";
    slideshowToken = "testslideshowtoken12345678901234";
    const event = await prisma.event.create({
      data: {
        coupleNames: "Test & Test",
        eventDate: new Date(),
        guestSlug,
        hostToken,
        slideshowToken,
        planTier: "starter",
        isPaid: true,
        paidAt: new Date(),
        expiresAt: computeExpiresAt(getPlan("starter")),
      },
    });
    eventId = event.id;
  });

  afterAll(async () => {
    await prisma.media.deleteMany({ where: { eventId } });
    await prisma.event.delete({ where: { id: eventId } });
    await prisma.$disconnect();
  });

  it("resolves events by unguessable tokens only", async () => {
    expect(await getEventByGuestSlug(guestSlug)).not.toBeNull();
    expect(await getEventByGuestSlug("wrong")).toBeNull();
    expect(await getEventByHostToken(hostToken)).not.toBeNull();
    expect(await getEventByHostToken("short")).toBeNull();
  });

  it("allows upload when paid and within limits", async () => {
    const event = await getEventByGuestSlug(guestSlug);
    expect(event).not.toBeNull();
    expect(eventAllowsUpload(event!)).toBe(true);
  });

  it("plan tiers have expected pricing", () => {
    expect(getPlan("starter").priceGel).toBe(49);
    expect(getPlan("classic").priceGel).toBe(99);
    expect(getPlan("premium").priceGel).toBe(149);
  });
});

describe("local storage fallback", () => {
  it("writes under local path", async () => {
    const { putObject, getObject, deleteObject } = await import("@/lib/storage");
    const key = "events/test-local/file.jpg";
    await putObject(key, Buffer.from("hello"), "image/jpeg");
    const buf = await getObject(key);
    expect(buf.toString()).toBe("hello");
    await deleteObject(key);
    await fs.rm("./data/test-uploads/events/test-local", { recursive: true, force: true });
  });
});
