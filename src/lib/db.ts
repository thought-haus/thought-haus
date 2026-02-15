const DB_NAME = "noti";
const DB_VERSION = 3;

/** Open the shared IndexedDB database with all stores. */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("handles")) {
        db.createObjectStore("handles");
      }
      if (!db.objectStoreNames.contains("search")) {
        db.createObjectStore("search");
      }
      if (!db.objectStoreNames.contains("backends")) {
        db.createObjectStore("backends");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
