import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_PREFIX = "memento_glu.";

function secret(): string {
  const s =
    process.env.GALLERY_UNLOCK_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim();
  if (!s || s.length < 16) {
    throw new Error("GALLERY_UNLOCK_SECRET or SESSION_SECRET required");
  }
  return s;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", secret()).update(payloadB64).digest("base64url");
}

function encodePayload(eventId: string, accessVersion: number, expSec: number): string {
  const raw = JSON.stringify({ e: eventId, v: accessVersion, exp: expSec });
  return Buffer.from(raw, "utf8").toString("base64url");
}

export function issueGalleryUnlockToken(
  eventId: string,
  accessVersion: number,
  maxAgeSec = 86_400,
): string {
  const expSec = Math.floor(Date.now() / 1000) + maxAgeSec;
  const payloadB64 = encodePayload(eventId, accessVersion, expSec);
  return `${COOKIE_PREFIX}${payloadB64}.${sign(payloadB64)}`;
}

export function verifyGalleryUnlockToken(
  cookieValue: string | undefined,
  eventId: string,
  accessVersion: number,
): boolean {
  if (!cookieValue?.startsWith(COOKIE_PREFIX)) return false;
  const rest = cookieValue.slice(COOKIE_PREFIX.length);
  const dot = rest.lastIndexOf(".");
  if (dot <= 0) return false;
  const payloadB64 = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as { e?: string; v?: number; exp?: number };
    if (parsed.e !== eventId || parsed.v !== accessVersion) return false;
    if (typeof parsed.exp !== "number" || parsed.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function galleryUnlockCookieName(eventId: string): string {
  return `gallery_unlock_${eventId}`;
}
