import { prisma } from "@/lib/prisma";
import type { Event } from "@/generated/prisma/client";
import { getPlan } from "@/lib/plans";

export async function getEventByGuestSlug(slug: string): Promise<Event | null> {
  if (!slug || slug.length < 12 || slug.length > 64) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) return null;
  return prisma.event.findUnique({ where: { guestSlug: slug } });
}

export async function getEventByHostToken(token: string): Promise<Event | null> {
  if (!token || token.length < 24 || token.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) return null;
  return prisma.event.findUnique({ where: { hostToken: token } });
}

export function eventIsActive(event: Event): boolean {
  if (!event.isPaid) return false;
  if (event.expiresAt && event.expiresAt < new Date()) return false;
  return true;
}

export function eventAllowsUpload(event: Event): boolean {
  if (!eventIsActive(event)) return false;
  const plan = getPlan(event.planTier);
  if (event.uploadCount >= plan.maxUploads) return false;
  if (event.totalBytes >= plan.maxTotalBytes) return false;
  return true;
}

export async function assertMediaBelongsToEvent(
  mediaId: string,
  eventId: string,
) {
  const media = await prisma.media.findFirst({
    where: { id: mediaId, eventId },
  });
  return media;
}
