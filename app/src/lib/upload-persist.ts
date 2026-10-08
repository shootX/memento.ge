import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { QueueItem } from '@/src/lib/upload-queue';

export type PersistedUploadMeta = {
  slug: string;
  guestName: string;
  guestKey: string;
};

export type PersistedQueueSnapshot = PersistedUploadMeta & {
  items: Array<{
    id: string;
    idempotencyKey: string;
    localUri: string;
    name: string;
    mimeType: string;
    status: QueueItem['status'];
    progress: number;
    errorMessage?: string;
  }>;
};

const storageKey = (slug: string) => `memento_upload_queue_${slug}`;

/** Durable queue files (survive app restarts; not OS cache eviction). */
export function uploadQueueDirectory(): string {
  const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "";
  return `${base}guest-upload-queue/`;
}

export function createIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function ensureUploadDir(): Promise<void> {
  const uploadDir = uploadQueueDirectory();
  if (!uploadDir) return;
  const info = await FileSystem.getInfoAsync(uploadDir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(uploadDir, { intermediates: true });
}

export async function stageUploadFile(sourceUri: string, idempotencyKey: string): Promise<string> {
  await ensureUploadDir();
  const uploadDir = uploadQueueDirectory();
  const ext = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = `${uploadDir}${idempotencyKey}.${ext}`;
  if (sourceUri.startsWith('http') || sourceUri.startsWith('file://')) {
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
  } else {
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
  }
  return dest;
}

export async function saveUploadQueue(meta: PersistedUploadMeta, items: QueueItem[]): Promise<void> {
  const snapshot: PersistedQueueSnapshot = {
    ...meta,
    items: items.map((item) => ({
      id: item.id,
      idempotencyKey: item.idempotencyKey,
      localUri: item.file.uri,
      name: item.file.name,
      mimeType: item.file.mimeType,
      status: item.status,
      progress: item.progress,
      errorMessage: item.errorMessage,
    })),
  };
  await AsyncStorage.setItem(storageKey(meta.slug), JSON.stringify(snapshot));
}

export async function loadUploadQueue(slug: string): Promise<PersistedQueueSnapshot | null> {
  const raw = await AsyncStorage.getItem(storageKey(slug));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedQueueSnapshot;
  } catch {
    return null;
  }
}

export async function clearUploadQueue(slug: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(slug));
}

export function snapshotToQueueItems(snapshot: PersistedQueueSnapshot): QueueItem[] {
  return snapshot.items
    .filter((i) => i.status !== 'done')
    .map((i) => ({
      id: i.id,
      idempotencyKey: i.idempotencyKey,
      file: { uri: i.localUri, name: i.name, mimeType: i.mimeType },
      status: i.status === 'uploading' ? 'pending' : i.status,
      progress: i.progress,
      errorMessage: i.errorMessage,
    }));
}
