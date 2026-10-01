import { getEventByHostToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObject } from "@/lib/storage";
import {
  extensionForMime,
  sanitizeZipEntryName,
} from "@/lib/upload-validation";
import { PassThrough } from "stream";
import { clientIp, consumeApi, jsonError } from "@/lib/api-utils";
import { verifyHostCsrf } from "@/lib/session";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  const ip = clientIp(req);
  try {
    await consumeApi(ip);
  } catch {
    return jsonError(429, "Too many requests");
  }

  const { token } = await params;
  const csrf = req.headers.get("x-csrf-token");
  if (!(await verifyHostCsrf(token, csrf))) {
    return jsonError(403, "Invalid CSRF");
  }

  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

  const media = await prisma.media.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
  });

  const createArchive = (await import("archiver")) as unknown as (
    format: string,
    options?: { zlib?: { level?: number } },
  ) => import("archiver").Archiver;

  const passthrough = new PassThrough();
  const archive = createArchive("zip", { zlib: { level: 5 } });
  archive.on("error", () => passthrough.destroy());
  archive.pipe(passthrough);

  let index = 0;
  for (const m of media) {
    index += 1;
    try {
      const buf = await getObject(m.storageKey);
      const ext = extensionForMime(m.mimeType);
      const name = sanitizeZipEntryName(
        m.guestName ?? m.id,
        index,
        ext,
      );
      archive.append(buf, { name });
    } catch {
      /* skip broken */
    }
  }
  void archive.finalize();

  const webStream = new ReadableStream({
    start(controller) {
      passthrough.on("data", (chunk: Buffer) => controller.enqueue(chunk));
      passthrough.on("end", () => controller.close());
      passthrough.on("error", (e) => controller.error(e));
    },
  });

  const safeName = event.coupleNames.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName || "album"}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
