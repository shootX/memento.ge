import { prisma } from "@/lib/prisma";

const ALLOWED = new Set([
  "visit",
  "create_event",
  "pay_start",
  "pay_ok",
  "pay_fail",
  "qr_view",
  "uploader_open",
  "upload_ok",
  "upload_fail",
  "download",
  "refund",
  "partner_view",
]);

export function sanitizeAnalyticsPayload(input: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v == null) continue;
    const s = String(v).slice(0, 120);
    if (/token|password|email|@|Bearer|session/i.test(k)) continue;
    if (/memento_|eyJ|Bearer/i.test(s)) continue;
    out[k] = s;
  }
  return out;
}

export async function recordAnalyticsEvent(
  name: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (!ALLOWED.has(name)) return;
  const clean = sanitizeAnalyticsPayload(payload);
  await prisma.auditLog.create({
    data: {
      action: `analytics:${name}`,
      metadata: JSON.stringify(clean),
    },
  });
}
