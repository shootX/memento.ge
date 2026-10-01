import { NextResponse } from "next/server";
import { getEventBySlideshowToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signMediaAccess } from "@/lib/crypto";
import { clientIp, consumeApi, handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { token } = await params;
    const event = await getEventBySlideshowToken(token);
    if (!event) return jsonError(404, "Not found");

    const items = await prisma.media.findMany({
      where: { eventId: event.id, status: "approved" },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    const exp = Date.now() + 3600_000;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    return NextResponse.json({
      coupleNames: event.coupleNames,
      eventDate: event.eventDate,
      guestUrl: `${appUrl}/e/${event.guestSlug}`,
      items: items.map((m) => ({
        id: m.id,
        mimeType: m.mimeType,
        guestName: m.guestName,
        url: `/api/media/${m.id}?token=${encodeURIComponent(signMediaAccess(m.id, exp))}`,
      })),
    });
  } catch (e) {
    return handleApiError(e);
  }
}
