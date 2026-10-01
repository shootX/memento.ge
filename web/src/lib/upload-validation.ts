import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

const ALLOWED_IMAGE = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const ALLOWED_VIDEO = new Set(["video/mp4", "video/quicktime", "video/webm"]);

const BLOCKED = new Set([
  "image/svg+xml",
  "text/html",
  "application/javascript",
  "image/gif",
]);

export type ValidatedUpload =
  | { kind: "image"; buffer: Buffer; mime: string; width: number; height: number }
  | { kind: "video"; buffer: Buffer; mime: string };

export async function validateAndProcessUpload(
  buffer: Buffer,
  declaredMime: string,
  maxBytes: number,
): Promise<ValidatedUpload> {
  if (buffer.length > maxBytes) {
    throw new ValidationError("File too large");
  }
  if (buffer.length < 12) {
    throw new ValidationError("File too small");
  }

  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime ?? declaredMime;

  if (BLOCKED.has(mime) || mime.includes("svg") || mime.includes("html")) {
    throw new ValidationError("File type not allowed");
  }

  const isImage = ALLOWED_IMAGE.has(mime);
  const isVideo = ALLOWED_VIDEO.has(mime);

  if (!isImage && !isVideo) {
    throw new ValidationError("Only photos and short videos are allowed");
  }

  if (isImage) {
    let img = sharp(buffer, { failOn: "error" });
    const meta = await img.metadata();
    if (!meta.width || !meta.height) {
      throw new ValidationError("Invalid image");
    }
    const out = await img
      .rotate()
      .resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    return {
      kind: "image",
      buffer: out.data,
      mime: "image/jpeg",
      width: out.info.width,
      height: out.info.height,
    };
  }

  return { kind: "video", buffer, mime };
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function extensionForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/quicktime") return "mov";
  if (mime === "video/webm") return "webm";
  return "bin";
}

export function sanitizeZipEntryName(name: string, index: number, ext: string): string {
  const base = name
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "")
    .slice(0, 80);
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  return `${String(index).padStart(4, "0")}_${base || "file"}.${safeExt}`;
}
