import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signMediaAccess } from "@/lib/crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { jsonError, clientIp } from "@/lib/api-utils";
import { consumeGalleryPassword, RateLimitError } from "@/lib/rate-limit";
import {
  galleryUnlockCookieName,
  issueGalleryUnlockToken,
  verifyGalleryUnlockToken,
} from "@/lib/gallery-unlock-session";

type Params = { params: Promise<{ slug: string }> };

async function resolveEvent(slug: string) {
  return prisma.event.findFirst({
    where: { OR: [{ customSlug: slug }, { guestSlug: slug }] },
    include: { partner: true },
  });
}

function galleryUnlocked(event: { id: string; galleryAccessVersion: number }, jar: Awaited<ReturnType<typeof cookies>>) {
  const token = jar.get(galleryUnlockCookieName(event.id))?.value;
  return verifyGalleryUnlockToken(token, event.id, event.galleryAccessVersion);
}

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;
  const event = await resolveEvent(slug);
  if (!event || !event.publicGallery) return jsonError(404, "Not found");

  if (event.galleryPasswordHash) {
    const jar = await cookies();
    if (!galleryUnlocked(event, jar)) {
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

  const ip = clientIp(req);
  try {
    await consumeGalleryPassword(ip, slug);
  } catch (e) {
    if (e instanceof RateLimitError) {
      return jsonError(429, "ძალიან ბევრი მცდელობა", "RATE_LIMITED");
    }
    throw e;
  }

  const { password } = (await req.json()) as { password: string };
  const ok = await bcrypt.compare(password, event.galleryPasswordHash);
  if (!ok) return jsonError(401, "არასწორი პაროლი");

  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(galleryUnlockCookieName(event.id), issueGalleryUnlockToken(event.id, event.galleryAccessVersion), {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 86_400,
  });
  return NextResponse.json({ ok: true });
}
