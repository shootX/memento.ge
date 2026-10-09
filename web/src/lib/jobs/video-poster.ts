import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { prisma } from "@/lib/prisma";
import { getObject, putObject } from "@/lib/storage";

const execFileAsync = promisify(execFile);
const TIMEOUT_MS = 30_000;
let active = 0;
const MAX_CONCURRENCY = Math.min(2, Number(process.env.VIDEO_POSTER_CONCURRENCY ?? 2));

export function ffmpegAvailable(): Promise<boolean> {
  return execFileAsync("ffmpeg", ["-version"], { timeout: 3000 })
    .then(() => true)
    .catch(() => false);
}

export async function generateVideoPoster(mediaId: string): Promise<string | null> {
  if (active >= MAX_CONCURRENCY) return null;
  active += 1;
  try {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || !media.mimeType.startsWith("video/")) return null;
    const sourceKey = media.originalKey ?? media.storageKey;
    const hasFfmpeg =
      process.env.VIDEO_POSTER_PLACEHOLDER_ONLY !== "1" && (await ffmpegAvailable());
    const posterKey = sourceKey.replace(/\.[^.]+$/, "_poster.jpg");

    if (!hasFfmpeg) {
      const placeholder = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64",
      );
      await putObject(posterKey, placeholder, "image/png");
      await prisma.media.update({
        where: { id: mediaId },
        data: { posterKey },
      });
      return posterKey;
    }

    const videoBuf = await getObject(sourceKey);
    const inPath = `/tmp/vin-${mediaId}`;
    const outPath = `/tmp/vout-${mediaId}.jpg`;
    const { writeFile, readFile, unlink } = await import("fs/promises");
    await writeFile(inPath, videoBuf);
    await execFileAsync(
      "ffmpeg",
      ["-hide_banner", "-loglevel", "error", "-y", "-i", inPath, "-frames:v", "1", "-q:v", "4", outPath],
      { timeout: TIMEOUT_MS },
    );
    const poster = await readFile(outPath);
    await putObject(posterKey, poster, "image/jpeg");
    await prisma.media.update({ where: { id: mediaId }, data: { posterKey } });
    await unlink(inPath).catch(() => {});
    await unlink(outPath).catch(() => {});
    return posterKey;
  } finally {
    active -= 1;
  }
}
