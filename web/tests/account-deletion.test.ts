import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { deleteUserAccount } from "@/lib/account-deletion";
import { createUserSession } from "@/lib/user-session";
import { putObject } from "@/lib/storage";

describe("account deletion", () => {
  beforeAll(() => {
    process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
    process.env.LOCAL_STORAGE_PATH = "./data/test-uploads";
  });

  it("purges owned events and anonymizes payments", async () => {
    const user = await prisma.user.create({ data: { email: `del-${nanoid(6)}@t.com` } });
    const token = nanoid(32);
    const event = await prisma.event.create({
      data: {
        coupleNames: "Del",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: token,
        slideshowToken: nanoid(32),
        ownerUserId: user.id,
        isPaid: true,
      },
    });
    const mediaId = crypto.randomUUID();
    const key = `events/${event.id}/${mediaId}.jpg`;
    await putObject(key, Buffer.from("x"), "image/jpeg");
    await prisma.media.create({
      data: {
        id: mediaId,
        eventId: event.id,
        storageKey: key,
        mimeType: "image/jpeg",
        size: 1,
      },
    });
    await prisma.payment.create({
      data: {
        userId: user.id,
        eventId: event.id,
        amountGel: 99,
        provider: "manual",
        status: "paid",
      },
    });
    const session = await createUserSession(user.id);
    expect(session.length).toBeGreaterThan(10);

    await deleteUserAccount(user.id);

    expect(await prisma.event.findUnique({ where: { id: event.id } })).toBeNull();
    expect(await prisma.media.count({ where: { eventId: event.id } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
    const pay = await prisma.payment.findFirst({
      where: { metadata: { contains: "anonymized" } },
    });
    expect(pay?.userId).toBeNull();
    expect(pay?.metadata).toContain("anonymized");
    const u = await prisma.user.findUnique({ where: { id: user.id } });
    expect(u?.email).toContain("anonymized");
  });
});
