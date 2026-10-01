import { prisma } from "@/lib/prisma";
import { getObject } from "@/lib/storage";
import { verifyMediaAccess } from "@/lib/crypto";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ eventId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { eventId } = await params;
  const url = new URL(req.url);
  const token =
    url.searchParams.get("token") ??
    url.searchParams.get("sig");
  if (!token || !verifyMediaAccess(`cover:${eventId}`, token)) {
    return jsonError(403, "Forbidden");
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event?.coverPhotoKey) return jsonError(404, "Not found");

  try {
    const buf = await getObject(event.coverPhotoKey);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonError(404, "Not found");
  }
}
