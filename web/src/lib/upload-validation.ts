import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import {
  type UploadErrorCode,
  uploadErrorMessageKa,
} from "@/lib/upload-errors";

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

export class ValidationError extends Error {
  readonly code: UploadErrorCode;
  readonly maxBytes?: number;

  constructor(code: UploadErrorCode, maxBytes?: number) {
    super(uploadErrorMessageKa(code, maxBytes));
    this.name = "ValidationError";
    this.code = code;
    this.maxBytes = maxBytes;
  }
}

function normalizeDeclaredMime(declaredMime: string, fileName?: string): string {
  const trimmed = declaredMime.trim().toLowerCase();
  if (trimmed) return trimmed;
  const ext = fileName?.split(".").pop()?.toLowerCase();
  if (ext === "heic" || ext === "heif") return "image/heic";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "mov") return "video/quicktime";
  if (ext === "mp4") return "video/mp4";
  if (ext === "webm") return "video/webm";
  return "";
}

function bufferLooksHeic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  if (buffer.toString("ascii", 4, 8) !== "ftyp") return false;
  const brand = buffer.toString("ascii", 8, 12).toLowerCase();
  if (["heic", "heix", "hevc", "heif", "mif1", "msf1"].includes(brand)) return true;
  const slice = buffer.subarray(0, Math.min(buffer.length, 32)).toString("ascii").toLowerCase();
  return slice.includes("heic") || slice.includes("heif") || slice.includes("mif1");
}

async function resolveMime(
  buffer: Buffer,
  declaredMime: string,
  fileName?: string,
): Promise<string> {
  const declared = normalizeDeclaredMime(declaredMime, fileName);
  const detected = await fileTypeFromBuffer(buffer);
  const detectedMime = detected?.mime;

  if (detectedMime && !BLOCKED.has(detectedMime)) {
    return detectedMime;
  }

  if (bufferLooksHeic(buffer)) {
    return "image/heic";
  }

  if (declared && ALLOWED_IMAGE.has(declared)) return declared;
  if (declared && ALLOWED_VIDEO.has(declared)) return declared;

  return detectedMime ?? declared;
}

async function decodeImageBuffer(buffer: Buffer, mime: string): Promise<Buffer> {
  const isHeic =
    mime === "image/heic" ||
    mime === "image/heif" ||
    bufferLooksHeic(buffer);
  if (!isHeic) return buffer;

  try {
    const mod = await import("heic-convert");
    const convert = mod.default ?? mod;
    const out = await convert({
      buffer,
      format: "JPEG",
      quality: 0.92,
    });
    return Buffer.from(out);
  } catch {
    throw new ValidationError("HEIC_UNSUPPORTED");
  }
}

export async function validateUploadIngress(
  buffer: Buffer,
  declaredMime: string,
  maxBytes: number,
  fileName?: string,
): Promise<{ mime: string; kind: "image" | "video" }> {
  if (buffer.length > maxBytes) {
    throw new ValidationError("FILE_TOO_LARGE", maxBytes);
  }
  if (buffer.length < 12) {
    throw new ValidationError("FILE_TOO_SMALL");
  }

  const mime = await resolveMime(buffer, declaredMime, fileName);

  if (BLOCKED.has(mime) || mime.includes("svg") || mime.includes("html")) {
    throw new ValidationError("FILE_TYPE_NOT_ALLOWED");
  }

  const isImage = ALLOWED_IMAGE.has(mime) || bufferLooksHeic(buffer);
  const isVideo = ALLOWED_VIDEO.has(mime);

  if (!isImage && !isVideo) {
    throw new ValidationError("UNSUPPORTED_FORMAT");
  }

  if (isVideo && mime === "video/mp4" && buffer.toString("ascii", 4, 8) !== "ftyp") {
    throw new ValidationError("INVALID_IMAGE");
  }

  return { mime, kind: isImage ? "image" : "video" };
}

export async function validateAndProcessUpload(
  buffer: Buffer,
  declaredMime: string,
  maxBytes: number,
  fileName?: string,
): Promise<ValidatedUpload> {
  if (buffer.length > maxBytes) {
    throw new ValidationError("FILE_TOO_LARGE", maxBytes);
  }
  if (buffer.length < 12) {
    throw new ValidationError("FILE_TOO_SMALL");
  }

  const mime = await resolveMime(buffer, declaredMime, fileName);

  if (BLOCKED.has(mime) || mime.includes("svg") || mime.includes("html")) {
    throw new ValidationError("FILE_TYPE_NOT_ALLOWED");
  }

  const isImage = ALLOWED_IMAGE.has(mime) || bufferLooksHeic(buffer);
  const isVideo = ALLOWED_VIDEO.has(mime);

  if (!isImage && !isVideo) {
    throw new ValidationError("UNSUPPORTED_FORMAT");
  }

  if (isImage) {
    try {
      const decoded = await decodeImageBuffer(buffer, mime);
      const img = sharp(decoded, { failOn: "error", unlimited: false });
      const meta = await img.metadata();
      if (!meta.width || !meta.height) {
        throw new ValidationError("INVALID_IMAGE");
      }
      const maxPixels = Number(process.env.MAX_IMAGE_PIXELS ?? 16_000_000);
      if (meta.width * meta.height > maxPixels) {
        throw new ValidationError("FILE_TOO_LARGE", maxBytes);
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
    } catch (e) {
      if (e instanceof ValidationError) throw e;
      throw new ValidationError("INVALID_IMAGE");
    }
  }

  return { kind: "video", buffer, mime };
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
