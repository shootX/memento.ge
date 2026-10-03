export function isFinalUploadHttpStatus(status: number): boolean {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

export type UploadResponseBody = {
  error?: string;
  code?: string;
  maxBytes?: number;
};

export function parseUploadErrorBody(text: string): UploadResponseBody {
  try {
    return JSON.parse(text) as UploadResponseBody;
  } catch {
    return {};
  }
}

/** Slow/mobile link — compress large images before upload. */
export function shouldCompressImagesForUpload(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!navigator.onLine) return false;
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean; downlink?: number } }).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") return true;
  if (typeof conn?.downlink === "number" && conn.downlink > 0 && conn.downlink < 1.5) return true;
  return false;
}

export async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const workers = Math.min(Math.max(1, concurrency), items.length || 1);

  async function runWorker() {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      await worker(items[index]!, index);
    }
  }

  await Promise.all(Array.from({ length: workers }, () => runWorker()));
}
