import type { StorageBackend, WebDavConfig } from "@thought-haus/core";
import { LocalBackend, WebDavBackend } from "@thought-haus/core";
import { browser, hasFileSystemAccess } from "./browser-compat.ts";

export interface ClipperStorageConfig {
  type: "local" | "webdav";
  webdav?: WebDavConfig;
  /** Persisted directory handle (Chromium only). Stored in IndexedDB. */
  dirHandle?: FileSystemDirectoryHandle;
}

const IDB_NAME = "thought-haus-clipper";
const IDB_STORE = "handles";
const IDB_KEY = "dir-handle";

/** Save a directory handle to IndexedDB for the extension context. */
export function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => {
      const tx = req.result.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Load a previously saved directory handle from IndexedDB. */
export function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => {
      const tx = req.result.transaction(IDB_STORE, "readonly");
      const getReq = tx.objectStore(IDB_STORE).get(IDB_KEY);
      getReq.onsuccess = () => resolve(getReq.result ?? null);
      getReq.onerror = () => reject(getReq.error);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Save WebDAV config to extension storage. */
export async function saveClipperConfig(config: ClipperStorageConfig): Promise<void> {
  await browser.storage.local.set({
    clipperStorageType: config.type,
    clipperWebDav: config.webdav ?? null,
  });
  if (config.dirHandle) {
    await saveDirHandle(config.dirHandle);
  }
}

/** Load clipper storage config from extension storage. */
export async function loadClipperConfig(): Promise<ClipperStorageConfig | null> {
  const data = await browser.storage.local.get(["clipperStorageType", "clipperWebDav"]);
  if (!data.clipperStorageType) return null;

  const config: ClipperStorageConfig = {
    type: data.clipperStorageType as "local" | "webdav",
    webdav: (data.clipperWebDav as WebDavConfig | undefined) ?? undefined,
  };

  if (config.type === "local") {
    config.dirHandle = (await loadDirHandle()) ?? undefined;
  }

  return config;
}

/** Create a StorageBackend from the clipper's saved configuration. */
export async function createBackendFromConfig(
  config: ClipperStorageConfig,
): Promise<StorageBackend | null> {
  if (config.type === "local" && config.dirHandle) {
    const perm = await config.dirHandle.queryPermission({ mode: "readwrite" });
    if (perm !== "granted") {
      const result = await config.dirHandle.requestPermission({ mode: "readwrite" });
      if (result !== "granted") return null;
    }
    return new LocalBackend(config.dirHandle);
  }

  if (config.type === "webdav" && config.webdav) {
    return new WebDavBackend(config.webdav);
  }

  return null;
}

/** Clear all clipper storage config. */
export async function clearClipperConfig(): Promise<void> {
  await browser.storage.local.remove(["clipperStorageType", "clipperWebDav"]);
}

export { hasFileSystemAccess };
