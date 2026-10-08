import { RateLimiterMemory } from "rate-limiter-flexible";
import { prisma } from "@/lib/prisma";

const uploadLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
});

const apiLimiter = new RateLimiterMemory({
  points: 120,
  duration: 60,
});

const loginLimiter = new RateLimiterMemory({
  points: 10,
  duration: 300,
});

const galleryPasswordLimiter = new RateLimiterMemory({
  points: 8,
  duration: 600,
});

async function consumePostgresBucket(
  bucketKey: string,
  maxPoints: number,
  windowSec: number,
): Promise<void> {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / (windowSec * 1000)) * windowSec * 1000);
  await prisma.$transaction(async (tx) => {
    const row = await tx.rateLimitBucket.findUnique({ where: { bucketKey } });
    if (!row || row.windowStart.getTime() !== windowStart.getTime()) {
      await tx.rateLimitBucket.upsert({
        where: { bucketKey },
        create: { bucketKey, points: 1, windowStart },
        update: { points: 1, windowStart },
      });
      return;
    }
    if (row.points >= maxPoints) {
      throw new RateLimitError();
    }
    await tx.rateLimitBucket.update({
      where: { bucketKey },
      data: { points: { increment: 1 } },
    });
  });
}

/** Guest uploads: event+guest scoped bucket (shared Wi‑Fi safe). */
export async function consumeUpload(
  ip: string,
  guestSlug: string,
  eventScopedKey?: string,
): Promise<void> {
  if (process.env.E2E_RATE_LIMIT_FREE === "1") return;
  const key = eventScopedKey ? `up:event:${eventScopedKey}` : `up:${ip}:${guestSlug}`;
  try {
    if (process.env.DATABASE_URL?.startsWith("postgresql")) {
      await consumePostgresBucket(key, 120, 60);
      return;
    }
    await uploadLimiter.consume(key);
  } catch (e) {
    if (e instanceof RateLimitError) throw e;
    throw new RateLimitError();
  }
}

export async function consumeApi(ip: string): Promise<void> {
  if (process.env.E2E_RATE_LIMIT_FREE === "1") return;
  try {
    await apiLimiter.consume(ip);
  } catch {
    throw new RateLimitError();
  }
}

export async function consumeLogin(ip: string): Promise<void> {
  if (process.env.E2E_RATE_LIMIT_FREE === "1") return;
  try {
    await loginLimiter.consume(ip);
  } catch {
    throw new RateLimitError();
  }
}

export async function consumeGalleryPassword(ip: string, slug: string): Promise<void> {
  if (process.env.E2E_RATE_LIMIT_FREE === "1") return;
  try {
    await galleryPasswordLimiter.consume(`gallery:${ip}:${slug}`);
  } catch {
    throw new RateLimitError();
  }
}

export class RateLimitError extends Error {
  constructor() {
    super("Too many requests");
    this.name = "RateLimitError";
  }
}
