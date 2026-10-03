import { createHmac, timingSafeEqual } from "crypto";

/** Documented TBC callback source IPs (developers.tbcbank.ge). */
export const TBC_CALLBACK_IP_ALLOWLIST = new Set([
  "193.104.20.44",
  "193.104.20.45",
  "185.52.80.44",
  "185.52.80.45",
]);

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "";
  return req.headers.get("x-real-ip")?.trim() ?? "";
}

function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** HMAC-SHA256 hex of raw callback body. */
export function tbcWebhookHmacHex(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

function hmacSecret(): string | undefined {
  return (
    process.env.TBC_WEBHOOK_HMAC_SECRET?.trim() ||
    process.env.TBC_WEBHOOK_SECRET?.trim() ||
    undefined
  );
}

function isProductionLivePayments(): boolean {
  return process.env.NODE_ENV === "production" && process.env.PAYMENT_MOCK !== "1";
}

/**
 * Public TBC webhook auth — never bypassed for PAYMENT_MOCK.
 * When TBC_WEBHOOK_SECRET (or HMAC alias) is set, HMAC header is mandatory.
 * Production live: fail closed unless HMAC valid or source IP is TBC allowlist.
 */
export function verifyTbcPublicCallbackAuth(req: Request, rawBody: string): boolean {
  const secret = hmacSecret();
  const sig = req.headers.get("x-tbc-signature") ?? req.headers.get("X-TBC-Signature");

  if (secret) {
    if (!sig) return false;
    return safeEqualString(sig, tbcWebhookHmacHex(rawBody, secret));
  }

  if (isProductionLivePayments()) {
    const ip = getClientIp(req);
    return Boolean(ip && TBC_CALLBACK_IP_ALLOWLIST.has(ip));
  }

  const ip = getClientIp(req);
  if (ip && TBC_CALLBACK_IP_ALLOWLIST.has(ip)) return true;

  return false;
}
