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

/** HMAC-SHA256 hex of raw callback body (optional merchant-configured check). */
export function tbcWebhookHmacHex(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

/**
 * Public TBC webhook auth: never bypassed for PAYMENT_MOCK.
 * Accepts documented bank IPs, Bearer shared secret, or HMAC of raw body.
 */
export function verifyTbcPublicCallbackAuth(req: Request, rawBody: string): boolean {
  const hmacSecret = process.env.TBC_WEBHOOK_HMAC_SECRET?.trim();
  const sig = req.headers.get("x-tbc-signature") ?? req.headers.get("X-TBC-Signature");
  if (hmacSecret && sig) {
    return safeEqualString(sig, tbcWebhookHmacHex(rawBody, hmacSecret));
  }

  const secret = process.env.TBC_WEBHOOK_SECRET?.trim();
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
    const headerSecret = req.headers.get("x-tbc-webhook-secret");
    if (headerSecret && safeEqualString(headerSecret, secret)) return true;
  }

  const ip = getClientIp(req);
  if (ip && TBC_CALLBACK_IP_ALLOWLIST.has(ip)) return true;

  return false;
}
