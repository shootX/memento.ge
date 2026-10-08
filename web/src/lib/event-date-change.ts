import type { PlanConfig } from "@/lib/plans";
import { deriveEventSchedule } from "@/lib/event-schedule";

/** Recompute schedule when event date changes; never shortens paid retention vs previous. */
export function applyEventDateChange(
  previousGalleryExpiresAt: Date | null | undefined,
  newEventDate: Date,
  plan: PlanConfig,
) {
  const derived = deriveEventSchedule(newEventDate, plan);
  let galleryExpiresAt = derived.galleryExpiresAt;
  if (previousGalleryExpiresAt && previousGalleryExpiresAt > galleryExpiresAt) {
    galleryExpiresAt = previousGalleryExpiresAt;
  }
  const purgeAt = new Date(galleryExpiresAt);
  purgeAt.setDate(purgeAt.getDate() + 7);
  return {
    uploadOpensAt: derived.uploadOpensAt,
    uploadClosesAt: derived.uploadClosesAt,
    galleryExpiresAt,
    purgeAt,
    expiresAt: galleryExpiresAt,
  };
}
