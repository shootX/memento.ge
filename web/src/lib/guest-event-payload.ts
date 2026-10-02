import {
  eventAllowsUpload,
  eventIsActive,
  eventInTrialUploads,
  getEventByPublicSlug,
} from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { signMediaAccess } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { trialUploadLimit } from "@/lib/site-config";

export type GuestEventPayload = {
  coupleNames: string;
  eventDate: string;
  canUpload: boolean;
  isActive: boolean;
  isPaid: boolean;
  inTrial: boolean;
  trialUploadsRemaining: number;
  disposable: {
    enabled: boolean;
    shotsPerGuest: number;
    revealAt: string | null;
  };
  branding: {
    logoUrl?: string | null;
    primaryColor?: string;
    partnerName?: string;
  } | null;
  limits: {
    maxBytesPerFile: number;
    remainingUploads: number;
    shotsRemaining: number | null;
  };
  coverUrl: string | null;
};

export async function buildGuestEventPayload(
  slug: string,
  guestKey?: string | null,
): Promise<GuestEventPayload | null> {
  const event = await getEventByPublicSlug(slug);
  if (!event) return null;

  const trial = trialUploadLimit();
  const plan = getPlan(event.planTier);
  let shotsRemaining: number | null = null;
  if (event.disposableEnabled && event.shotsPerGuest > 0 && guestKey) {
    const q = await prisma.guestShotQuota.findUnique({
      where: { eventId_guestKey: { eventId: event.id, guestKey } },
    });
    shotsRemaining = event.shotsPerGuest - (q?.used ?? 0);
  }

  const exp = Date.now() + 3600_000;
  let coverUrl: string | null = null;
  if (event.coverPhotoKey) {
    const token = signMediaAccess(`cover:${event.id}`, exp);
    coverUrl = `/api/media/cover/${event.id}?token=${encodeURIComponent(token)}`;
  }

  const partner = event.partnerOrgId
    ? await prisma.partnerOrg.findUnique({ where: { id: event.partnerOrgId } })
    : null;

  return {
    coupleNames: event.coupleNames,
    eventDate: event.eventDate.toISOString(),
    canUpload: eventAllowsUpload(event),
    isActive: eventIsActive(event),
    isPaid: event.isPaid,
    inTrial: eventInTrialUploads(event),
    trialUploadsRemaining: event.isPaid
      ? 0
      : Math.max(0, trial - event.uploadCount),
    disposable: {
      enabled: event.disposableEnabled,
      shotsPerGuest: event.shotsPerGuest,
      revealAt: event.revealAt?.toISOString() ?? null,
    },
    branding: partner?.whiteLabel
      ? {
          logoUrl: partner.logoUrl ?? event.brandingLogoUrl,
          primaryColor: partner.primaryColor ?? event.brandingPrimary,
          partnerName: partner.name,
        }
      : null,
    limits: {
      maxBytesPerFile: plan.maxBytesPerFile,
      remainingUploads: Math.max(0, plan.maxUploads - event.uploadCount),
      shotsRemaining,
    },
    coverUrl,
  };
}
