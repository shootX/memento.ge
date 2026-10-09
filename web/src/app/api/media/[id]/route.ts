import { prisma } from "@/lib/prisma";
import { openObjectReadStream, statObject } from "@/lib/storage";
import { verifyMediaAccess } from "@/lib/crypto";
import { jsonError } from "@/lib/api-utils";
import { isGuestVisibleMediaStatus } from "@/lib/media-visibility";
import { Readable } from "stream";

type Params = { params: Promise<{ id: string }> };

function parseRange(header: string | null, size: number): { start: number; end: number } | null {
  if (!header?.startsWith("bytes=")) return null;
  const [raw] = header.replace(/bytes=/, "").split(",");
  const [s, e] = raw.split("-");
  const start = s ? Number.parseInt(s, 10) : 0;
  const end = e ? Number.parseInt(e, 10) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start) return null;
  return { start, end: Math.min(end, size - 1) };
}

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
  if (!isGuestVisibleMediaStatus(media.status)) {
    return jsonError(404, "Not found");
  }

  const key =
    variant === "thumb" && media.thumbKey
      ? media.thumbKey
      : media.displayKey ?? media.storageKey;
  const contentType =
    variant === "thumb" ? "image/jpeg" : media.mimeType;

  try {
    const { size } = await statObject(key);
    const range = parseRange(req.headers.get("range"), size);
    if (range) {
      const { stream, start, end } = await openObjectReadStream(key, range);
      const web = Readable.toWeb(stream) as ReadableStream;
      return new Response(web, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Length": String(end - start + 1),
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=300",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
        },
      });
    }
    const { stream } = await openObjectReadStream(key);
    const web = Readable.toWeb(stream) as ReadableStream;
    return new Response(web, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return jsonError(404, "Not found");
  }
}
