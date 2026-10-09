import { getEventByHostToken, eventIsActive } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { signMediaAccess, signCsrfToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { appUrl } from "@/lib/site-config";

export async function getHostBootstrap(token: string) {
  const event = await getEventByHostToken(token);
  if (!event) return null;

  const plan = getPlan(event.planTier);
  const exp = Date.now() + 3600_000;
  let coverUrl: string | null = null;
  if (event.coverPhotoKey) {
    const coverToken = signMediaAccess(`cover:${event.id}`, exp);
    coverUrl = `/api/media/cover/${event.id}?token=${encodeURIComponent(coverToken)}`;
  }

  const items = await prisma.media.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const media = items.map((m) => {
    const mediaToken = signMediaAccess(m.id, exp);
    const thumbToken = m.thumbKey ? signMediaAccess(`${m.id}:thumb`, exp) : null;
    return {
      id: m.id,
      mimeType: m.mimeType,
      guestName: m.guestName,
      status: m.status,
      highlight: m.highlight,
      url: `/api/media/${m.id}?token=${encodeURIComponent(mediaToken)}`,
      thumbUrl: thumbToken
        ? `/api/media/${m.id}?token=${encodeURIComponent(thumbToken)}&variant=thumb`
        : `/api/media/${m.id}?token=${encodeURIComponent(mediaToken)}`,
    };
  });

  const messages = await prisma.guestMessage.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const base = appUrl();
  const publicSlug = event.customSlug ?? event.guestSlug;

  return {
    coupleNames: event.coupleNames,
    eventDate: event.eventDate.toISOString(),
    guestUrl: `${base}/e/${publicSlug}`,
    hostUrl: `${base}/host/${token}`,
    slideshowUrl: `${base}/slideshow/${event.slideshowToken}`,
    isPaid: event.isPaid,
    planTier: event.planTier,
    usage: {
      uploadCount: event.uploadCount,
      totalBytes: Number(event.totalBytes),
      maxUploads: plan.maxUploads,
      priceGel: plan.priceGel,
    },
    coverUrl,
    csrfToken: signCsrfToken(token),
    customSlug: event.customSlug,
    publicGallery: event.publicGallery,
    disposableEnabled: event.disposableEnabled,
    shotsPerGuest: event.shotsPerGuest,
    revealAt: event.revealAt?.toISOString() ?? null,
    moderateUploads: event.moderateUploads,
    isActive: eventIsActive(event),
    media,
    messages: messages.map((m) => ({
      id: m.id,
      guestName: m.guestName,
      body: m.body ?? (m.type === "audio" ? "🎤 ხმოვანი შეტყობინება" : ""),
      createdAt: m.createdAt.toISOString(),
      status: m.status,
      type: m.type,
    })),
  };
}
