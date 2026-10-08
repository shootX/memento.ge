import { prisma } from "@/lib/prisma";
import type { Event } from "@/generated/prisma/client";
import { getPlan } from "@/lib/plans";
import { trialUploadLimit } from "@/lib/site-config";
import { isEventExpired } from "@/lib/tbilisi-time";
import { bigintToNumber } from "@/lib/bytes-json";
import { isWithinUploadWindow } from "@/lib/event-schedule";

function isValidPublicSlug(slug: string): boolean {
  if (!slug || slug.length < 3 || slug.length > 64) return false;
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

/** Guest upload URL slug (auto-generated guestSlug or host customSlug). */
export async function getEventByPublicSlug(slug: string): Promise<Event | null> {
  if (!isValidPublicSlug(slug)) return null;
  return prisma.event.findFirst({
    where: { OR: [{ guestSlug: slug }, { customSlug: slug }] },
  });
}

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

export async function getEventBySlideshowToken(
  token: string,
): Promise<Event | null> {
  if (!token || token.length < 24 || token.length > 128) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) return null;
  return prisma.event.findUnique({ where: { slideshowToken: token } });
}

export function eventIsActive(event: Event): boolean {
  if (!event.isPaid) return false;
  if (isEventExpired(event.expiresAt)) return false;
  return true;
}

export function eventInTrialUploads(event: Event): boolean {
  const trial = trialUploadLimit();
  if (trial <= 0 || event.isPaid) return false;
  return event.uploadCount < trial;
}

export function eventAllowsUpload(event: Event): boolean {
  const expiry = event.galleryExpiresAt ?? event.expiresAt;
  if (isEventExpired(expiry)) return false;
  if (!isWithinUploadWindow(new Date(), event.uploadOpensAt, event.uploadClosesAt)) {
    return false;
  }
  const plan = getPlan(event.planTier);
  const totalBytes = bigintToNumber(event.totalBytes);

  if (event.isPaid) {
    if (event.uploadCount >= plan.maxUploads) return false;
    if (totalBytes >= plan.maxTotalBytes) return false;
    return true;
  }

  if (eventInTrialUploads(event)) {
    return event.uploadCount < trialUploadLimit();
  }

  return false;
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
