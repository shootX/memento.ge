import { NextResponse } from "next/server";
import { getEventByHostToken, eventIsActive } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { signMediaAccess, signCsrfToken } from "@/lib/crypto";
import { clientIp, consumeApi, handleApiError, jsonError } from "@/lib/api-utils";
import { appUrl } from "@/lib/site-config";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { token } = await params;
    const event = await getEventByHostToken(token);
    if (!event) return jsonError(404, "Not found");

    const plan = getPlan(event.planTier);
    const exp = Date.now() + 3600_000;
    let coverUrl: string | null = null;
    if (event.coverPhotoKey) {
      const coverToken = signMediaAccess(`cover:${event.id}`, exp);
      coverUrl = `/api/media/cover/${event.id}?token=${encodeURIComponent(coverToken)}`;
    }

    const csrfToken = signCsrfToken(token);
    const base = appUrl();
    const publicSlug = event.customSlug ?? event.guestSlug;

    return NextResponse.json({
      id: event.id,
      coupleNames: event.coupleNames,
      eventDate: event.eventDate,
      guestSlug: event.guestSlug,
      planTier: event.planTier,
      isPaid: event.isPaid,
      isActive: eventIsActive(event),
      expiresAt: event.expiresAt,
      usage: {
        uploadCount: event.uploadCount,
        totalBytes: event.totalBytes,
        maxUploads: plan.maxUploads,
        maxTotalBytes: plan.maxTotalBytes,
        priceGel: plan.priceGel,
      },
      guestUrl: `${base}/e/${publicSlug}`,
      hostUrl: `${base}/host/${token}`,
      slideshowToken: event.slideshowToken,
      slideshowUrl: `${base}/slideshow/${event.slideshowToken}`,
      coverUrl,
      csrfToken,
      customSlug: event.customSlug,
      publicGallery: event.publicGallery,
      disposableEnabled: event.disposableEnabled,
      shotsPerGuest: event.shotsPerGuest,
      revealAt: event.revealAt,
      moderateUploads: event.moderateUploads,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
