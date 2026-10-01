import { NextResponse } from "next/server";
import {
  RateLimitError,
  consumeApi,
  consumeLogin,
  consumeUpload,
} from "@/lib/rate-limit";
import { ValidationError } from "@/lib/upload-validation";

export { consumeApi, consumeLogin, consumeUpload };

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof RateLimitError) {
    return jsonError(429, "Too many requests");
  }
  if (err instanceof ValidationError) {
    return jsonError(400, err.message);
  }
  console.error(err);
  return jsonError(500, "Internal error");
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
