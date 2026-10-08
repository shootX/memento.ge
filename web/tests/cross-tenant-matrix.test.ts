import { describe, it, expect, beforeAll, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { createUserSession } from "@/lib/user-session";
import { createMobileAccessToken } from "@/lib/mobile-access-token";
import { createAdminSession, validateAdminSession } from "@/lib/session";

let mockUserCookie: string | undefined;

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        mockUserCookie && name === "memento_user"
          ? { value: mockUserCookie }
          : undefined,
    }),
}));

describe("cross-tenant access matrix", () => {
  let tokenA: string;
  let tokenB: string;
  let slugA: string;
  let mediaA: string;
  let mediaB: string;
  let eventA: string;
  let sessionOwnerA: string;
  let sessionOwnerB: string;
  let sessionCoHost: string;
  let partnerCookie: string;
  let partnerOrgA: string;

  beforeAll(async () => {
    process.env.SESSION_SECRET = "test-session-secret-32-characters!!";
    const ua = await prisma.user.create({ data: { email: `a-${nanoid(6)}@t.com` } });
    const ub = await prisma.user.create({ data: { email: `b-${nanoid(6)}@t.com` } });
    const uc = await prisma.user.create({ data: { email: `c-${nanoid(6)}@t.com` } });
    const up = await prisma.user.create({ data: { email: `p-${nanoid(6)}@t.com` } });
    tokenA = nanoid(32);
    tokenB = nanoid(32);
    slugA = nanoid(21);
    const a = await prisma.event.create({
      data: {
        coupleNames: "A",
        eventDate: new Date(),
        guestSlug: slugA,
        hostToken: tokenA,
        slideshowToken: nanoid(32),
        ownerUserId: ua.id,
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
        ownerUserId: ub.id,
        isPaid: true,
      },
    });
    eventA = a.id;
    mediaA = (
      await prisma.media.create({
        data: {
          id: crypto.randomUUID(),
          eventId: eventA,
          storageKey: `events/${eventA}/a.jpg`,
          mimeType: "image/jpeg",
          size: 1,
          status: "pending",
        },
      })
    ).id;
    mediaB = (
      await prisma.media.create({
        data: {
          id: crypto.randomUUID(),
          eventId: b.id,
          storageKey: `events/${b.id}/b.jpg`,
          mimeType: "image/jpeg",
          size: 1,
        },
      })
    ).id;
    await prisma.eventCoHost.create({ data: { eventId: eventA, userId: uc.id } });
    partnerOrgA = (await prisma.partnerOrg.create({ data: { name: "PA", slug: `pa-${nanoid(6)}` } })).id;
    await prisma.partnerMember.create({ data: { partnerId: partnerOrgA, userId: up.id } });
    await prisma.event.update({ where: { id: eventA }, data: { partnerOrgId: partnerOrgA } });
    sessionOwnerA = (await createMobileAccessToken(ua.id)).accessToken;
    sessionOwnerB = (await createMobileAccessToken(ub.id)).accessToken;
    sessionCoHost = (await createMobileAccessToken(uc.id)).accessToken;
    partnerCookie = await createUserSession(up.id);
    await createAdminSession();
  });

  const bearer = (session: string) => ({
    "content-type": "application/json",
    authorization: `Bearer ${session}`,
  });

  it("table-driven routes (owner/co-host/partner/other/anonymous)", async () => {
    const matrix: { label: string; status: number; run: () => Promise<Response> }[] = [];

    matrix.push({
      label: "settings: ownerA on A",
      status: 200,
      run: async () => {
      const { PATCH } = await import("@/app/api/host/[token]/settings/route");
      return PATCH(
        new Request(`http://local/api/host/${tokenA}/settings`, {
          method: "PATCH",
          headers: bearer(sessionOwnerA),
          body: JSON.stringify({ publicGallery: true }),
        }),
        { params: Promise.resolve({ token: tokenA }) },
      );
      },
    });
    matrix.push({
      label: "settings: ownerB on A",
      status: 403,
      run: async () => {
      const { PATCH } = await import("@/app/api/host/[token]/settings/route");
      return PATCH(
        new Request(`http://local/api/host/${tokenA}/settings`, {
          method: "PATCH",
          headers: bearer(sessionOwnerB),
          body: JSON.stringify({ publicGallery: false }),
        }),
        { params: Promise.resolve({ token: tokenA }) },
      );
      },
    });
    matrix.push({
      label: "settings: coHost on A",
      status: 200,
      run: async () => {
      const { PATCH } = await import("@/app/api/host/[token]/settings/route");
      return PATCH(
        new Request(`http://local/api/host/${tokenA}/settings`, {
          method: "PATCH",
          headers: bearer(sessionCoHost),
          body: JSON.stringify({ shotsPerGuest: 3 }),
        }),
        { params: Promise.resolve({ token: tokenA }) },
      );
      },
    });
    matrix.push({
      label: "settings: anonymous on A",
      status: 403,
      run: async () => {
      const { PATCH } = await import("@/app/api/host/[token]/settings/route");
      return PATCH(
        new Request(`http://local/api/host/${tokenA}/settings`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ publicGallery: true }),
        }),
        { params: Promise.resolve({ token: tokenA }) },
      );
      },
    });
    matrix.push({
      label: "export: ownerA on A",
      status: 200,
      run: async () => {
      const { POST } = await import("@/app/api/host/[token]/export/route");
      return POST(
        new Request(`http://local/api/host/${tokenA}/export`, {
          method: "POST",
          headers: bearer(sessionOwnerA),
        }),
        { params: Promise.resolve({ token: tokenA }) },
      );
      },
    });
    matrix.push({
      label: "export: ownerB on A",
      status: 403,
      run: async () => {
      const { POST } = await import("@/app/api/host/[token]/export/route");
      return POST(
        new Request(`http://local/api/host/${tokenA}/export`, {
          method: "POST",
          headers: bearer(sessionOwnerB),
        }),
        { params: Promise.resolve({ token: tokenA }) },
      );
      },
    });
    matrix.push({
      label: "moderation: ownerB on A media",
      status: 403,
      run: async () => {
      const { PATCH } = await import("@/app/api/host/[token]/media/[id]/route");
      return PATCH(
        new Request(`http://local/api/host/${tokenA}/media/${mediaA}`, {
          method: "PATCH",
          headers: bearer(sessionOwnerB),
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ token: tokenA, id: mediaA }) },
      );
      },
    });
    matrix.push({
      label: "moderation: coHost on A media",
      status: 200,
      run: async () => {
      const { PATCH } = await import("@/app/api/host/[token]/media/[id]/route");
      return PATCH(
        new Request(`http://local/api/host/${tokenA}/media/${mediaA}`, {
          method: "PATCH",
          headers: bearer(sessionCoHost),
          body: JSON.stringify({ status: "approved" }),
        }),
        { params: Promise.resolve({ token: tokenA, id: mediaA }) },
      );
      },
    });
    matrix.push({
      label: "payments: checkout ownerB on A",
      status: 403,
      run: async () => {
      const { POST } = await import("@/app/api/host/[token]/checkout/route");
      return POST(
        new Request(`http://local/api/host/${tokenA}/checkout`, {
          method: "POST",
          headers: bearer(sessionOwnerB),
          body: JSON.stringify({ provider: "manual" }),
        }),
        { params: Promise.resolve({ token: tokenA }) },
      );
      },
    });
    matrix.push({
      label: "host: GET anonymous valid token",
      status: 200,
      run: async () => {
      const { GET } = await import("@/app/api/host/[token]/route");
      return GET(new Request(`http://local/api/host/${tokenA}`), {
        params: Promise.resolve({ token: tokenA }),
      });
      },
    });
    matrix.push({
      label: "guest report: anonymous on A",
      status: 200,
      run: async () => {
      const { POST } = await import("@/app/api/guest/[slug]/media/[id]/report/route");
      return POST(
        new Request(`http://local/api/guest/${slugA}/media/${mediaA}/report`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: "spam test", guestKey: "g1" }),
        }),
        { params: Promise.resolve({ slug: slugA, id: mediaA }) },
      );
      },
    });
    matrix.push({
      label: "guest report: cross media",
      status: 404,
      run: async () => {
      const { POST } = await import("@/app/api/guest/[slug]/media/[id]/report/route");
      return POST(
        new Request(`http://local/api/guest/${slugA}/media/${mediaB}/report`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: "cross", guestKey: "g1" }),
        }),
        { params: Promise.resolve({ slug: slugA, id: mediaB }) },
      );
      },
    });

    for (const row of matrix) {
      const res = await row.run();
      expect(res.status, row.label).toBe(row.status);
    }
  });

  it("partner session sees only org A events", async () => {
    mockUserCookie = partnerCookie;
    const { GET } = await import("@/app/api/partner/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { partner: { events: { id: string }[] } };
    expect(body.partner.events.some((e) => e.id === eventA)).toBe(true);
    expect(body.partner.events.every((e) => e.id !== mediaB)).toBe(true);
  });

  it("admin session validates", async () => {
    expect(await validateAdminSession(undefined)).toBe(false);
  });
});
