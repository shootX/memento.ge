import { prisma } from "@/lib/prisma";
import { getObject } from "@/lib/storage";
import { verifyMediaAccess } from "@/lib/crypto";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const token =
    url.searchParams.get("token") ??
    url.searchParams.get("sig");
  if (!token || !verifyMediaAccess(id, token)) {
    return jsonError(403, "Forbidden");
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return jsonError(404, "Not found");

  const buf = await getObject(media.storageKey);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
