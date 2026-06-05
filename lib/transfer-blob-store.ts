"use client";

const DB_NAME = "pairflux-files";
const STORE_NAME = "blobs";
const DB_VERSION = 1;
const MAX_BYTES = 500 * 1024 * 1024;

interface BlobEntry {
  id: string;
  blob: Blob;
  savedAt: number;
  byteSize: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllEntries(): Promise<BlobEntry[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      db.close();
      resolve((req.result as BlobEntry[]) ?? []);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

async function evictOldest(requiredBytes: number): Promise<void> {
  const entries = await getAllEntries();
  entries.sort((a, b) => a.savedAt - b.savedAt);
  let freed = 0;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const entry of entries) {
      if (freed >= requiredBytes) break;
      store.delete(entry.id);
      freed += entry.byteSize ?? entry.blob?.size ?? 0;
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function saveBlob(id: string, blob: Blob): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const byteSize = blob.size;
  const entries = await getAllEntries();
  const total = entries.reduce((sum, e) => sum + (e.byteSize ?? e.blob?.size ?? 0), 0);
  if (total + byteSize > MAX_BYTES) {
    await evictOldest(total + byteSize - MAX_BYTES);
  }
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, blob, savedAt: Date.now(), byteSize });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function getBlob(id: string): Promise<Blob | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
      db.close();
      const entry = req.result as BlobEntry | undefined;
      resolve(entry?.blob ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function deleteBlob(id: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function pruneExcept(keepIds: Set<string>): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const entries = await getAllEntries();
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (const entry of entries) {
      if (!keepIds.has(entry.id)) {
        store.delete(entry.id);
      }
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
