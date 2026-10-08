import { prisma } from "@/lib/prisma";
import { signMediaAccess } from "@/lib/crypto";
import { cookies } from "next/headers";

export async function getPublicGalleryBootstrap(slug: string) {
  const event = await prisma.event.findFirst({
    where: { OR: [{ customSlug: slug }, { guestSlug: slug }] },
    include: { partner: true },
  });
  if (!event || !event.publicGallery) return null;

  if (event.galleryPasswordHash) {
    const jar = await cookies();
    const unlocked = jar.get(`gallery_${event.id}`)?.value;
    if (unlocked !== "1") {
      return { locked: true as const, coupleNames: event.coupleNames, items: [] };
    }
  }

  const media = await prisma.media.findMany({
    where: { eventId: event.id, status: "approved" },
    orderBy: { createdAt: "desc" },
    take: 200,
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
