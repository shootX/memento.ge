import fs from "fs/promises";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const backend =
  process.env.STORAGE_DRIVER ?? process.env.STORAGE_BACKEND ?? "local";

export function assertStorageConfigured(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (backend === "local") {
    if (!process.env.LOCAL_STORAGE_PATH?.trim()) {
      throw new Error("LOCAL_STORAGE_PATH is required when STORAGE_DRIVER=local in production");
    }
    return;
  }
  if (backend === "s3") {
    if (!process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY_ID) {
      throw new Error("S3_BUCKET and S3_ACCESS_KEY_ID required for STORAGE_DRIVER=s3");
    }
  }
}
const localRoot = path.resolve(
  process.cwd(),
  process.env.LOCAL_STORAGE_PATH?.replace(/^\.\//, "") ?? "data/uploads",
);

function s3Client(): S3Client | null {
  if (backend !== "s3") return null;
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "auto";
  if (!process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY_ID) return null;
  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    forcePathStyle: Boolean(endpoint),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}

/** Reject path traversal and unsafe keys */
export function sanitizeStorageKey(key: string): string | null {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.startsWith("/")) {
    return null;
  }
  if (!/^[a-zA-Z0-9/_\-.]+$/.test(normalized)) return null;
  if (normalized.length > 512) return null;
  return normalized;
}

export function buildMediaKey(eventId: string, mediaId: string, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  return `events/${eventId}/${mediaId}.${safeExt}`;
}

async function ensureLocalDir(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const safeKey = sanitizeStorageKey(key);
  if (!safeKey) throw new Error("Invalid storage key");

  const client = s3Client();
  if (client && process.env.S3_BUCKET) {
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: safeKey,
        Body: body,
        ContentType: contentType,
      }),
    );
    return;
  }

  const full = path.join(localRoot, safeKey);
  await ensureLocalDir(full);
  await fs.writeFile(full, body);
}

export async function getObject(key: string): Promise<Buffer> {
  const safeKey = sanitizeStorageKey(key);
  if (!safeKey) throw new Error("Invalid storage key");

  const client = s3Client();
  if (client && process.env.S3_BUCKET) {
    const res = await client.send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: safeKey }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error("Empty object");
    return Buffer.from(bytes);
  }

  const full = path.join(localRoot, safeKey);
  const resolved = path.resolve(full);
  if (!resolved.startsWith(path.resolve(localRoot))) {
    throw new Error("Path traversal blocked");
  }
  return fs.readFile(resolved);
}

export async function deleteObject(key: string): Promise<void> {
  const safeKey = sanitizeStorageKey(key);
  if (!safeKey) throw new Error("Invalid storage key");

  const client = s3Client();
  if (client && process.env.S3_BUCKET) {
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: safeKey }),
    );
    return;
  }

  const full = path.join(localRoot, safeKey);
  try {
    await fs.unlink(full);
  } catch {
    /* ignore missing */
  }
}

export async function getSignedMediaUrl(
  key: string,
  expiresSec = 3600,
): Promise<string | null> {
  const safeKey = sanitizeStorageKey(key);
  if (!safeKey) return null;

  const client = s3Client();
  if (client && process.env.S3_BUCKET) {
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: safeKey }),
      { expiresIn: expiresSec },
    );
  }
  return null;
}
