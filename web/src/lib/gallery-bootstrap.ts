import { prisma } from "@/lib/prisma";
import { signMediaAccess } from "@/lib/crypto";
import { cookies } from "next/headers";
import {
  galleryUnlockCookieName,
  verifyGalleryUnlockToken,
} from "@/lib/gallery-unlock-session";

export async function getPublicGalleryBootstrap(slug: string) {
  const event = await prisma.event.findFirst({
    where: { OR: [{ customSlug: slug }, { guestSlug: slug }] },
    include: { partner: true },
  });
  if (!event || !event.publicGallery) return null;

  if (event.galleryPasswordHash) {
    const jar = await cookies();
    const token = jar.get(galleryUnlockCookieName(event.id))?.value;
    if (!verifyGalleryUnlockToken(token, event.id, event.galleryAccessVersion)) {
      return { locked: true as const, coupleNames: event.coupleNames, items: [] };
    }
  }

  const media = await prisma.media.findMany({
    where: { eventId: event.id, status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const exp = Date.now() + 3600_000;
  return {
    locked: false as const,
    coupleNames: event.coupleNames,
    items: media.map((m) => ({
      id: m.id,
      url: `/api/media/${m.id}?token=${encodeURIComponent(signMediaAccess(m.id, exp))}`,
      thumbUrl: m.thumbKey
        ? `/api/media/${m.id}?token=${encodeURIComponent(signMediaAccess(`${m.id}:thumb`, exp))}&variant=thumb`
        : `/api/media/${m.id}?token=${encodeURIComponent(signMediaAccess(m.id, exp))}`,
      guestName: m.guestName,
    })),
  };
}
