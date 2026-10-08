import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signMediaAccess } from "@/lib/crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

async function resolveEvent(slug: string) {
  return prisma.event.findFirst({
    where: { OR: [{ customSlug: slug }, { guestSlug: slug }] },
    include: { partner: true },
  });
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const event = await resolveEvent(slug);
  if (!event || !event.publicGallery) return jsonError(404, "Not found");

  if (event.galleryPasswordHash) {
    const jar = await cookies();
    const unlocked = jar.get(`gallery_${event.id}`)?.value;
    if (unlocked !== "1") {
      return NextResponse.json({ locked: true, coupleNames: event.coupleNames });
    }
  }

  const media = await prisma.media.findMany({
    where: { eventId: event.id, status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const exp = Date.now() + 3600_000;
  return NextResponse.json({
    coupleNames: event.coupleNames,
    eventDate: event.eventDate,
    branding: event.partner?.whiteLabel
      ? {
          logoUrl: event.partner.logoUrl,
          primaryColor: event.partner.primaryColor,
          name: event.partner.name,
        }
      : null,
    items: media.map((m) => ({
      id: m.id,
      url: `/api/media/${m.id}?token=${encodeURIComponent(signMediaAccess(m.id, exp))}`,
      thumbUrl: m.thumbKey
        ? `/api/media/${m.id}?token=${encodeURIComponent(signMediaAccess(`${m.id}:thumb`, exp))}&variant=thumb`
        : null,
      guestName: m.guestName,
    })),
  });
}

export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const event = await resolveEvent(slug);
  if (!event?.galleryPasswordHash) return jsonError(400, "No password");

  const { password } = (await req.json()) as { password: string };
  const ok = await bcrypt.compare(password, event.galleryPasswordHash);
  if (!ok) return jsonError(401, "Wrong password");

  const jar = await cookies();
  jar.set(`gallery_${event.id}`, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 86400,
  });
  return NextResponse.json({ ok: true });
}
