const DB_NAME = "noti";
const DB_VERSION = 3;

let cached: Promise<IDBDatabase> | null = null;

/** Open the shared IndexedDB database with all stores. Returns a cached connection. */
export function openDB(): Promise<IDBDatabase> {
  if (cached) return cached;

  cached = new Promise<IDBDatabase>((resolve, reject) => {
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
    req.onsuccess = () => {
      const db = req.result;
      // If the connection is closed externally, clear the cache
      db.onversionchange = () => {
        db.close();
        cached = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      cached = null;
      reject(req.error);
    };
  });

  return cached;
}
