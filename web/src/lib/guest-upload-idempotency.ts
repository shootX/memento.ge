import { prisma } from "@/lib/prisma";

const CLIENT_KEY_MAX = 128;
const KEY_RE = /^[a-zA-Z0-9._-]+$/;

export function normalizeClientUploadKey(raw: FormDataEntryValue | null): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || s.length > CLIENT_KEY_MAX) return null;
  if (!KEY_RE.test(s)) return null;
  return s;
}

/** Mobile `Idempotency-Key` header or PWA `clientUploadKey` form field. */
export function resolveUploadIdempotencyKey(req: Request, form: FormData): string | null {
  const header = req.headers.get("Idempotency-Key") ?? req.headers.get("idempotency-key");
  if (header) {
    const fromHeader = normalizeClientUploadKey(header);
    if (fromHeader) return fromHeader;
  }
  return normalizeClientUploadKey(form.get("clientUploadKey"));
}

export async function findExistingUploadByClientKey(
  eventId: string,
  clientKey: string,
): Promise<{ mediaId: string } | null> {
  const row = await prisma.guestUploadIdempotency.findUnique({
    where: { eventId_clientKey: { eventId, clientKey } },
  });
  return row ? { mediaId: row.mediaId } : null;
}

export async function recordUploadClientKey(
  eventId: string,
  clientKey: string,
  mediaId: string,
): Promise<void> {
  try {
    await prisma.guestUploadIdempotency.create({
      data: { eventId, clientKey, mediaId },
    });
  } catch {
    /* concurrent duplicate — ignore */
  }
}
