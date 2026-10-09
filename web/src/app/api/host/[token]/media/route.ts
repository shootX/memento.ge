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

    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor");
    const take = Math.min(100, Number(url.searchParams.get("limit") ?? "50") || 50);

    const items = await prisma.media.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const hasMore = items.length > take;
    const page = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? page[page.length - 1]?.id : null;

    const exp = Date.now() + 3600_000;
    const mapped = page.map((m) => {
      const mediaToken = signMediaAccess(m.id, exp);
      const thumbToken = m.thumbKey ? signMediaAccess(`${m.id}:thumb`, exp) : null;
      return {
        id: m.id,
        mimeType: m.mimeType,
        guestName: m.guestName,
        status: m.status,
        highlight: m.highlight,
        createdAt: m.createdAt,
        url: `/api/media/${m.id}?token=${encodeURIComponent(mediaToken)}`,
        thumbUrl: thumbToken
          ? `/api/media/${m.id}?token=${encodeURIComponent(thumbToken)}&variant=thumb`
          : `/api/media/${m.id}?token=${encodeURIComponent(mediaToken)}`,
      };
    });

    return NextResponse.json({ items: mapped, nextCursor });
  } catch (e) {
    return handleApiError(e);
  }
}
