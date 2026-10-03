import { config } from '@/src/config';
import { mockApi } from '@/src/api/mock';

export class UploadError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly maxBytes?: number,
    public readonly final = false,
  ) {
    super(message);
    this.name = 'UploadError';
  }
}

export type UploadFileInput = {
  uri: string;
  name: string;
  mimeType: string;
};

export type UploadProgressHandler = (percent: number) => void;

function parseUploadError(status: number, text: string): UploadError {
  let body: { error?: string; code?: string; maxBytes?: number } = {};
  try {
    body = JSON.parse(text);
  } catch {
    /* ignore */
  }
  const final = status >= 400 && status < 500 && status !== 408 && status !== 429;
  return new UploadError(body.error ?? 'Upload failed', body.code, body.maxBytes, final);
}

/**
 * XMLHttpRequest-based upload for progress events (mirrors web guest flow).
 */
export function uploadGuestFile(
  slug: string,
  file: UploadFileInput,
  guestName: string | undefined,
  guestKey: string,
  onProgress: UploadProgressHandler,
  maxRetries = 4,
): Promise<void> {
  if (config.useMockApi) {
    return mockApi.uploadGuest().then(() => {
      onProgress(100);
    });
  }

  const url = `${config.apiUrl}/api/guest/${encodeURIComponent(slug)}/upload`;

  const attempt = (retry: number): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob);
      if (guestName) form.append('guestName', guestName);
      form.append('guestKey', guestKey);

      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable && ev.total > 0) {
          onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress(100);
          resolve();
          return;
        }
        const err = parseUploadError(xhr.status, xhr.responseText);
        if (!err.final && retry < maxRetries) {
          setTimeout(() => {
            attempt(retry + 1).then(resolve, reject);
          }, 800 * (retry + 1));
          return;
        }
        reject(err);
      });

      xhr.addEventListener('error', () => {
        if (retry < maxRetries) {
          setTimeout(() => {
            attempt(retry + 1).then(resolve, reject);
          }, 800 * (retry + 1));
          return;
        }
        reject(new UploadError('Network error', undefined, undefined, false));
      });

      xhr.open('POST', url);
      xhr.send(form);
    });

  return attempt(0);
}

export type QueueItem = {
  id: string;
  file: UploadFileInput;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  errorMessage?: string;
};

export async function runUploadQueue(
  items: QueueItem[],
  slug: string,
  guestName: string,
  guestKey: string,
  onUpdate: (id: string, patch: Partial<QueueItem>) => void,
  concurrency = 3,
): Promise<void> {
  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const i = index;
      index += 1;
      const item = items[i];
      if (item.status === 'error') continue;

      onUpdate(item.id, { status: 'uploading', progress: 0 });
      try {
        await uploadGuestFile(slug, item.file, guestName, guestKey, (p) => {
          onUpdate(item.id, { progress: p });
        });
        onUpdate(item.id, { status: 'done', progress: 100 });
      } catch (e) {
        const msg = e instanceof UploadError ? e.message : 'Upload failed';
        onUpdate(item.id, { status: 'error', progress: 0, errorMessage: msg });
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
}
