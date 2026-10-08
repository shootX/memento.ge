import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  RateLimitError,
  consumeApi,
  consumeLogin,
  consumeUpload,
} from "@/lib/rate-limit";
import { ValidationError } from "@/lib/upload-validation";

export { consumeApi, consumeLogin, consumeUpload };

export function jsonError(
  status: number,
  message: string,
  code?: string,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json(
    code ? { error: message, code, ...extra } : { error: message, ...(extra ?? {}) },
    { status },
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof RateLimitError) {
    return jsonError(429, "Too many requests", "RATE_LIMITED");
  }
  if (err instanceof ValidationError) {
    return NextResponse.json(
      { error: err.message, code: err.code, maxBytes: err.maxBytes },
      { status: 400 },
    );
  }
  if (err instanceof ZodError) {
    return jsonError(400, "Invalid request", "VALIDATION_ERROR");
  }
  if (err instanceof TypeError && /formdata|multipart/i.test(err.message)) {
    return jsonError(400, "Invalid upload body", "INVALID_FORM_DATA");
  }
  console.error(err);
  return jsonError(500, "Internal error");
}

export async function readFormData(req: Request): Promise<FormData | Response> {
  try {
    return await req.formData();
  } catch (e) {
    if (e instanceof TypeError) {
      return jsonError(400, "Invalid multipart body", "INVALID_FORM_DATA");
    }
    throw e;
  }
}

export function clientIp(req: Request): string {
  const trusted = process.env.TRUSTED_PROXY_IPS?.split(",").map((s) => s.trim()) ?? [];
  const remote = req.headers.get("x-vercel-forwarded-for") ?? "127.0.0.1";
  const trustForward =
    trusted.length === 0 || trusted.some((ip) => remote.startsWith(ip));
  if (trustForward) {
    const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (xff) return xff;
  }
  return req.headers.get("x-real-ip") || remote || "unknown";
}
