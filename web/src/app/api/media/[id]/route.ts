import { prisma } from "@/lib/prisma";
import { getObject } from "@/lib/storage";
import { verifyMediaAccess } from "@/lib/crypto";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const url = new URL(req.url);
  const variant = url.searchParams.get("variant");
  const token =
    url.searchParams.get("token") ??
    url.searchParams.get("sig");

  const mediaIdForToken = variant === "thumb" ? `${id}:thumb` : id;
  if (!token || !verifyMediaAccess(mediaIdForToken, token)) {
    return jsonError(403, "Forbidden");
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return jsonError(404, "Not found");

  const key =
    variant === "thumb" && media.thumbKey ? media.thumbKey : media.storageKey;
  const contentType =
    variant === "thumb" ? "image/jpeg" : media.mimeType;

  const buf = await getObject(key);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
