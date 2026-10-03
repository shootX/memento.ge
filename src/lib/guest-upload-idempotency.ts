import { prisma } from "@/lib/prisma";

const CLIENT_KEY_MAX = 128;

export function normalizeClientUploadKey(raw: FormDataEntryValue | null): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || s.length > CLIENT_KEY_MAX) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(s)) return null;
  return s;
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
