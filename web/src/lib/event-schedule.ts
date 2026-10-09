import type { PlanConfig } from "@/lib/plans";
import { computeExpiresAt } from "@/lib/plans";
import { tbilisiWallTimeToUtc } from "@/lib/tbilisi-time";

/** Derive upload/gallery/purge instants from event calendar date (Asia/Tbilisi). */
export function deriveEventSchedule(eventDate: Date, plan: PlanConfig) {
  const y = eventDate.getUTCFullYear();
  const m = eventDate.getUTCMonth() + 1;
  const d = eventDate.getUTCDate();
  const uploadOpensAt = tbilisiWallTimeToUtc(y, m, d, 0, 0, 0);
  const uploadClosesAt = computeExpiresAt(plan, uploadOpensAt);
  const galleryExpiresAt = uploadClosesAt;
  const purgeAt = new Date(galleryExpiresAt);
  purgeAt.setDate(purgeAt.getDate() + 7);
  return { uploadOpensAt, uploadClosesAt, galleryExpiresAt, purgeAt };
}

export function isWithinUploadWindow(
  now: Date,
  uploadOpensAt: Date | null | undefined,
  uploadClosesAt: Date | null | undefined,
): boolean {
  if (uploadOpensAt && now < uploadOpensAt) return false;
  if (uploadClosesAt && now > uploadClosesAt) return false;
  return true;
}

/** Paid activation anchor: validity starts at event day (Tbilisi), not payment time. */
export function paidRetentionExpiresAt(eventDate: Date, plan: PlanConfig): Date {
  const { galleryExpiresAt } = deriveEventSchedule(eventDate, plan);
  return galleryExpiresAt;
}
