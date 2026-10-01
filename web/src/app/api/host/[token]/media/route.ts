import { NextResponse } from "next/server";
import { getEventByHostToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signMediaAccess } from "@/lib/crypto";
import { clientIp, consumeApi, handleApiError, jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    await consumeApi(clientIp(req));
    const { token } = await params;
    const event = await getEventByHostToken(token);
    if (!event) return jsonError(404, "Not found");

    const items = await prisma.media.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const exp = Date.now() + 3600_000;
    const mapped = items.map((m) => {
      const mediaToken = signMediaAccess(m.id, exp);
      return {
        id: m.id,
        mimeType: m.mimeType,
        guestName: m.guestName,
        createdAt: m.createdAt,
        url: `/api/media/${m.id}?token=${encodeURIComponent(mediaToken)}`,
      };
    });

    return NextResponse.json({ items: mapped });
  } catch (e) {
    return handleApiError(e);
  }
}
