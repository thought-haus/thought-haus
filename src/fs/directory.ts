const DB_NAME = "noti";
const STORE_NAME = "handles";
const HANDLE_KEY = "directoryHandle";

/** Open the IndexedDB database. */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Persist a directory handle to IndexedDB. */
export async function saveDirectoryHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Retrieve a saved directory handle from IndexedDB. */
export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** Show the native directory picker and return the handle. */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  return window.showDirectoryPicker({ mode: "readwrite" });
}

/** Check if we have read/write permission on a handle. */
export async function checkPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const state = await handle.queryPermission({ mode: "readwrite" });
  return state === "granted";
}

/** Request read/write permission on a handle. */
export async function requestPermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const state = await handle.requestPermission({ mode: "readwrite" });
  return state === "granted";
}
