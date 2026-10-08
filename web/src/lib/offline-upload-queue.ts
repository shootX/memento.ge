"use client";

const DB_NAME = "memento-offline-v1";
const STORE = "uploads";
const DB_VERSION = 1;

export type QueuedUpload = {
  id: string;
  slug: string;
  guestName: string;
  guestKey: string;
  clientUploadKey: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  createdAt: number;
  retries: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

export async function enqueueUpload(
  item: Omit<QueuedUpload, "id" | "createdAt" | "retries" | "clientUploadKey"> & {
    clientUploadKey?: string;
  },
) {
  const db = await openDb();
  const record: QueuedUpload = {
    ...item,
    clientUploadKey: item.clientUploadKey ?? crypto.randomUUID(),
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retries: 0,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await registerBackgroundSync();
  return record.id;
}

export async function listQueuedUploads(slug?: string): Promise<QueuedUpload[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result as QueuedUpload[]).sort(
        (a, b) => a.createdAt - b.createdAt,
      );
      resolve(slug ? all.filter((u) => u.slug === slug) : all);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedUpload(id: string) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function flushUploadQueue(slug?: string): Promise<{ ok: number; fail: number }> {
  const items = await listQueuedUploads(slug);
  let ok = 0;
  let fail = 0;
  for (const item of items) {
    try {
      const form = new FormData();
      form.append("file", new File([item.blob], item.fileName, { type: item.mimeType }));
      if (item.guestName) form.append("guestName", item.guestName);
      form.append("guestKey", item.guestKey);
      form.append("clientUploadKey", item.clientUploadKey);
      const res = await fetch(`/api/guest/${item.slug}/upload`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("upload failed");
      await removeQueuedUpload(item.id);
      ok += 1;
    } catch {
      fail += 1;
      const db = await openDb();
      const next = { ...item, retries: item.retries + 1 };
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(next);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }
  return { ok, fail };
}

export async function registerBackgroundSync() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ("sync" in reg) {
      await (reg as ServiceWorkerRegistration & { sync: { register: (t: string) => Promise<void> } }).sync.register(
        "memento-upload-sync",
      );
    }
  } catch {
    /* iOS / unsupported */
  }
}
