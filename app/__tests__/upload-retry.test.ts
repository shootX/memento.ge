jest.mock('@/src/config', () => ({
  config: { apiUrl: 'https://test.example', useMockApi: false, deepLinkHost: 'memento.ge' },
}));

jest.mock('@/src/lib/upload-queue', () => {
  const actual = jest.requireActual<typeof import('@/src/lib/upload-queue')>('@/src/lib/upload-queue');
  return {
    ...actual,
    uploadGuestFile: jest.fn().mockResolvedValue(undefined),
  };
});

import { isNonRetryableUploadError, manualRetryQueueItem } from '@/src/lib/upload-retry';
import { UploadError } from '@/src/lib/upload-queue';

describe('upload-retry', () => {
  it('classifies non-retryable upload errors', () => {
    expect(isNonRetryableUploadError(new UploadError('x', 'FILE_TOO_LARGE', 1, true))).toBe(true);
    expect(isNonRetryableUploadError(new UploadError('x', undefined, undefined, false))).toBe(false);
  });

  it('manual retry marks done on success', async () => {
    const item = {
      id: '1',
      idempotencyKey: 'k1',
      file: { uri: 'file:///a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' },
      status: 'error' as const,
      progress: 0,
    };
    const updates: unknown[] = [];
    await manualRetryQueueItem(item, 'slug', 'Guest', 'gk', (id, patch) => {
      updates.push({ id, patch });
    });
    expect(updates.some((u) => (u as { patch: { status: string } }).patch.status === 'done')).toBe(
      true,
    );
  });
});
