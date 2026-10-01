import { NextResponse } from "next/server";
import { getEventByGuestSlug, eventAllowsUpload, eventIsActive } from "@/lib/auth";
import { getPlan } from "@/lib/plans";
import { signMediaAccess } from "@/lib/crypto";
import { clientIp, consumeApi, handleApiError } from "@/lib/api-utils";

type Params = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { slug } = await params;
    const event = await getEventByGuestSlug(slug);
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const plan = getPlan(event.planTier);
    const guestKey = new URL(req.url).searchParams.get("guestKey");
    let shotsRemaining: number | null = null;
    if (event.disposableEnabled && event.shotsPerGuest > 0 && guestKey) {
      const q = await (await import("@/lib/prisma")).prisma.guestShotQuota.findUnique({
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
      ? await (await import("@/lib/prisma")).prisma.partnerOrg.findUnique({
          where: { id: event.partnerOrgId },
        })
      : null;

    return NextResponse.json({
      coupleNames: event.coupleNames,
      eventDate: event.eventDate,
      canUpload: eventAllowsUpload(event),
      isActive: eventIsActive(event),
      disposable: {
        enabled: event.disposableEnabled,
        shotsPerGuest: event.shotsPerGuest,
        revealAt: event.revealAt,
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
    });
  } catch (e) {
    return handleApiError(e);
  }
}
