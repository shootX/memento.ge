import { RateLimiterMemory } from "rate-limiter-flexible";

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

export async function consumeUpload(ip: string, guestSlug: string): Promise<void> {
  const key = `up:${ip}:${guestSlug}`;
  try {
    await uploadLimiter.consume(key);
  } catch {
    throw new RateLimitError();
  }
}

export async function consumeApi(ip: string): Promise<void> {
  try {
    await apiLimiter.consume(ip);
  } catch {
    throw new RateLimitError();
  }
}

export async function consumeLogin(ip: string): Promise<void> {
  try {
    await loginLimiter.consume(ip);
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
