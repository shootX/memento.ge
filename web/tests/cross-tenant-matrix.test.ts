import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { hashToken, createUserSession } from "@/lib/user-session";

describe("cross-tenant access matrix", () => {
  let ownerA: string;
  let ownerB: string;
  let eventA: string;
  let tokenA: string;
  let tokenB: string;
  let mediaB: string;
  let sessionB: string;

  beforeAll(async () => {
    process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
    const ua = await prisma.user.create({ data: { email: `a-${nanoid(6)}@t.com` } });
    const ub = await prisma.user.create({ data: { email: `b-${nanoid(6)}@t.com` } });
    ownerA = ua.id;
    ownerB = ub.id;
    tokenA = nanoid(32);
    tokenB = nanoid(32);
    const a = await prisma.event.create({
      data: {
        coupleNames: "A",
        eventDate: new Date(),
        guestSlug: nanoid(21),
        hostToken: tokenA,
        slideshowToken: nanoid(32),
        ownerUserId: ownerA,
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
        ownerUserId: ownerB,
        isPaid: true,
      },
    });
    eventA = a.id;
    mediaB = (
      await prisma.media.create({
        data: {
          id: crypto.randomUUID(),
          eventId: b.id,
          storageKey: `events/${b.id}/x.jpg`,
          mimeType: "image/jpeg",
          size: 1,
        },
      })
    ).id;
    sessionB = await createUserSession(ownerB);
  });

  it("owner B bearer cannot PATCH event A host media", async () => {
    const { PATCH } = await import("@/app/api/host/[token]/media/[id]/route");
    const res = await PATCH(
      new Request(`http://local/api/host/${tokenA}/media/${mediaB}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionB}`,
        },
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ token: tokenA, id: mediaB }) },
    );
    expect(res.status).toBe(403);
  });

  it("partner org events isolated", async () => {
    const pa = await prisma.partnerOrg.create({ data: { name: "PA", slug: `pa-${nanoid(6)}` } });
    const pb = await prisma.partnerOrg.create({ data: { name: "PB", slug: `pb-${nanoid(6)}` } });
    await prisma.event.update({ where: { id: eventA }, data: { partnerOrgId: pa.id } });
    const cross = await prisma.event.findFirst({
      where: { id: eventA, partnerOrgId: pb.id },
    });
    expect(cross).toBeNull();
  });
});
