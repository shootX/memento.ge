import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function secret(name: string): string {
  const v = process.env[name];
  if (!v || v.length < 16) {
    if (process.env.NODE_ENV === "test") return "test-secret-32-characters-long!!";
    throw new Error(`Missing or weak ${name}`);
  }
  return v;
}

export function newToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function signMediaAccess(mediaId: string, exp: number): string {
  const payload = `${mediaId}.${exp}`;
  const sig = createHmac("sha256", secret("MEDIA_SIGNING_SECRET"))
    .update(payload)
    .digest("base64url");
  return `${exp}.${sig}`;
}

export function verifyMediaAccess(
  mediaId: string,
  token: string,
): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const exp = Number(parts[0]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = signMediaAccess(mediaId, exp);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function signCsrfToken(sessionId: string): string {
  return createHmac("sha256", secret("CSRF_SECRET"))
    .update(sessionId)
    .digest("base64url");
}

export function verifyCsrfToken(sessionId: string, token: string): boolean {
  const expected = signCsrfToken(sessionId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
