import { getEventBySlideshowToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signMediaAccess } from "@/lib/crypto";

export async function getSlideshowBootstrap(token: string) {
  const event = await getEventBySlideshowToken(token);
  if (!event) return null;

  const items = await prisma.media.findMany({
    where: { eventId: event.id, status: "approved" },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  const exp = Date.now() + 3600_000;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  let coverUrl: string | null = null;
  if (event.coverPhotoKey) {
    const coverToken = signMediaAccess(`cover:${event.id}`, exp);
    coverUrl = `/api/media/cover/${event.id}?token=${encodeURIComponent(coverToken)}`;
  }

  return {
    coupleNames: event.coupleNames,
    eventDate: event.eventDate.toISOString(),
    guestUrl: `${appUrl}/e/${event.guestSlug}`,
    coverUrl,
    items: items.map((m) => ({
      id: m.id,
      mimeType: m.mimeType,
      guestName: m.guestName,
      url: `/api/media/${m.id}?token=${encodeURIComponent(signMediaAccess(m.id, exp))}`,
    })),
  };
}
