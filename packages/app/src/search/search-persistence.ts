import { openDB } from "@thought-haus/core";

const STORE_NAME = "search";
const INDEX_KEY = "searchIndex";

/** Save serialized search index to IndexedDB. */
export async function saveSearchIndex(json: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(json, INDEX_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load serialized search index from IndexedDB. Returns null if not found. */
export async function loadSearchIndex(): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(INDEX_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}
