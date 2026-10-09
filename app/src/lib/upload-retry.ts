import { UploadError, type QueueItem, uploadGuestFile } from '@/src/lib/upload-queue';

const NON_RETRYABLE_CODES = new Set([
  'FILE_TOO_LARGE',
  'UNSUPPORTED_FORMAT',
  'INVALID_IMAGE',
  'SHOT_LIMIT_REACHED',
  'STORAGE_LIMIT',
  'UPLOADS_NOT_ALLOWED',
  'IDEMPOTENCY_CONFLICT',
]);

export function isNonRetryableUploadError(err: unknown): boolean {
  if (!(err instanceof UploadError)) return false;
  if (err.final) return true;
  if (err.code && NON_RETRYABLE_CODES.has(err.code)) return true;
  return false;
}

export async function manualRetryQueueItem(
  item: QueueItem,
  slug: string,
  guestName: string,
  guestKey: string,
  onUpdate: (id: string, patch: Partial<QueueItem>) => void,
): Promise<void> {
  if (item.status === 'done') return;
  onUpdate(item.id, { status: 'uploading', progress: 0, errorMessage: undefined });
  try {
    await uploadGuestFile(
      slug,
      item.file,
      guestName,
      guestKey,
      (p) => onUpdate(item.id, { progress: p }),
      0,
      item.idempotencyKey,
    );
    onUpdate(item.id, { status: 'done', progress: 100 });
  } catch (e) {
    const msg = e instanceof UploadError ? e.message : 'Upload failed';
    const final = isNonRetryableUploadError(e);
    onUpdate(item.id, {
      status: 'error',
      progress: 0,
      errorMessage: final ? msg : `${msg} (retryable)`,
    });
    throw e;
  }
}
