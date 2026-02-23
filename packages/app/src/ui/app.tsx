import { useEffect } from "preact/hooks";
import {
  appView,
  appLoading,
  folderName,
  storageBackend,
  savedHandle,
  savedWebDavConfig,
  selectedNoteId,
  initTheme,
  initSort,
  initSidebarWidth,
  initAgentPanelWidth,
  initMobile,
} from "../lib/app-state.ts";
import { isFileSystemAccessSupported } from "../lib/browser.ts";
import {
  pickDirectory,
  saveDirectoryHandle,
  loadDirectoryHandle,
  checkPermission,
  requestPermission,
} from "../fs/directory.ts";
import {
  LocalBackend,
  WebDavBackend,
  testWebDavConnection,
  saveWebDavConfig,
  loadWebDavConfig,
  saveActiveBackendType,
  loadActiveBackendType,
  clearBackendConfig,
  parseFrontMatter,
} from "@thought-haus/core";
import type { WebDavConfig, StorageBackend } from "@thought-haus/core";
import { scanNotes } from "../storage/scan.ts";
import { setNotes, clearNotes } from "../notes/note-store.ts";
import { createWelcomeNote } from "../notes/note-actions.ts";
import { buildIndex, clearSearch, serializeIndex } from "../search/search-engine.ts";
import { saveSearchIndex } from "../search/search-persistence.ts";
import { startWatcher } from "../storage/file-watcher.ts";
import { loadFavorites } from "../favorites/favorite-persistence.ts";
import { favoriteIds, initFavoritesCollapsed } from "../favorites/favorite-store.ts";
import { initRecentlyViewed, startRecentlyViewedTracking } from "../recently-viewed/recently-viewed-store.ts";
import { startRouter, applyPendingHash } from "../lib/router.ts";
import { Onboarding } from "./onboarding.tsx";
import { RePermission } from "./re-permission.tsx";
import { WebDavReconnect } from "./webdav-reconnect.tsx";
import { Layout } from "./layout.tsx";
import { LoadingScreen } from "./loading-screen.tsx";

const fsAccessSupported = isFileSystemAccessSupported();

let stopWatcher: (() => void) | null = null;

/** The last backend passed to openWithBackend, used for retry. */
let lastBackendForRetry: StorageBackend | null = null;

async function openWithBackend(backend: StorageBackend): Promise<void> {
  lastBackendForRetry = backend;
  storageBackend.value = backend;
  folderName.value = backend.name;

  // Persist backend config
  if (backend.type === "local") {
    const raw = (backend as LocalBackend).getRawHandle?.();
    if (raw) {
      await saveDirectoryHandle(raw);
    }
    await saveActiveBackendType("local");
  } else if (backend.type === "webdav") {
    await saveActiveBackendType("webdav");
  }

  // Phase 1: Scan notes
  appView.value = "loading";
  appLoading.value = { phase: "scanning", loaded: 0 };

  let notes;
  try {
    notes = await scanNotes(backend, (loaded) => {
      appLoading.value = { phase: "scanning", loaded };
    });
  } catch (err) {
    appLoading.value = {
      phase: "error",
      message: err instanceof Error ? err.message : "Failed to scan notes",
    };
    return;
  }

  setNotes(notes);
  await loadFavorites(backend);

  // Switch to main view — notes are visible, index still building
  appView.value = "main";
  applyPendingHash();
  if (notes.length === 0) {
    await createWelcomeNote();
  }

  // Phase 2: Build search index (non-blocking — user can browse notes)
  appLoading.value = { phase: "indexing", loaded: 0, total: notes.length };
  try {
    const docs: { id: string; title: string; tags: string[]; body: string; lastModified: number }[] = [];
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const raw = await backend.read(note.filename);
      const { body } = parseFrontMatter(raw);
      docs.push({ id: note.id, title: note.title, tags: note.tags, body, lastModified: note.lastModified });
      appLoading.value = { phase: "indexing", loaded: i + 1, total: notes.length };
    }
    buildIndex(docs);
    saveSearchIndex(serializeIndex()).catch(() => {});
  } catch (err) {
    // Index failure is non-fatal — notes are still usable
    console.error("Failed to build search index:", err);
  }
  appLoading.value = { phase: "idle" };

  // Start watching for external changes
  if (stopWatcher) stopWatcher();
  stopWatcher = startWatcher(backend);
}

async function retryLoad(): Promise<void> {
  if (lastBackendForRetry) {
    await openWithBackend(lastBackendForRetry);
  }
}

function changeStorageFromError(): void {
  appLoading.value = { phase: "idle" };
  storageBackend.value = null;
  folderName.value = null;
  clearBackendConfig().catch(() => {});
  appView.value = "onboarding";
}

async function openFolder(): Promise<void> {
  let handle: FileSystemDirectoryHandle;
  try {
    handle = await pickDirectory();
  } catch {
    return; // User cancelled the picker
  }
  const backend = new LocalBackend(handle);
  await openWithBackend(backend);
}

async function connectWebDav(config: WebDavConfig): Promise<void> {
  const backend = new WebDavBackend(config);
  await saveWebDavConfig(config);
  await openWithBackend(backend);
}

async function disconnectBackend(): Promise<void> {
  if (stopWatcher) {
    stopWatcher();
    stopWatcher = null;
  }
  storageBackend.value?.disconnect();
  storageBackend.value = null;
  folderName.value = null;
  selectedNoteId.value = null;
  clearNotes();
  clearSearch();
  favoriteIds.value = [];
  await clearBackendConfig();
  appView.value = "onboarding";
}

async function reRequestPermission(): Promise<void> {
  const handle = savedHandle.value;
  if (!handle) return;

  const granted = await requestPermission(handle);
  if (granted) {
    savedHandle.value = null;
    const backend = new LocalBackend(handle);
    await openWithBackend(backend);
  } else {
    // Permission denied — fall back to full onboarding
    savedHandle.value = null;
    appView.value = "onboarding";
  }
}

async function tryRestoreSession(): Promise<void> {
  try {
    const backendType = await loadActiveBackendType();

    if (!backendType) {
      appView.value = "onboarding";
      return;
    }

    if (backendType === "webdav") {
      const config = await loadWebDavConfig();
      if (!config) {
        appView.value = "onboarding";
        return;
      }

      const result = await testWebDavConnection(config.url, config.username, config.password);
      if (result.ok) {
        const backend = new WebDavBackend(config);
        await openWithBackend(backend);
      } else {
        savedWebDavConfig.value = config;
        appView.value = "webdav-reconnect";
      }
      return;
    }

    // backendType === "local"
    const handle = await loadDirectoryHandle();
    if (!handle) {
      appView.value = "onboarding";
      return;
    }

    if (await checkPermission(handle)) {
      const backend = new LocalBackend(handle);
      await openWithBackend(backend);
    } else {
      // Permission expired — show one-click re-permission
      savedHandle.value = handle;
      folderName.value = handle.name;
      appView.value = "re-permission";
    }
  } catch {
    // IndexedDB or permission error — fall through to onboarding
    appView.value = "onboarding";
  }
}

async function retryWebDavConnection(): Promise<void> {
  const config = savedWebDavConfig.value;
  if (!config) return;

  const result = await testWebDavConnection(config.url, config.username, config.password);
  if (result.ok) {
    savedWebDavConfig.value = null;
    const backend = new WebDavBackend(config);
    await openWithBackend(backend);
  }
}

function changeServer(): void {
  savedWebDavConfig.value = null;
  clearBackendConfig().catch(() => {});
  appView.value = "onboarding";
}

// Export for nav sidebar "Change Storage" action
export { disconnectBackend };

export function App() {
  useEffect(() => {
    initTheme();
    initSort();
    initSidebarWidth();
    initAgentPanelWidth();
    initFavoritesCollapsed();
    initRecentlyViewed();
    startRecentlyViewedTracking();
    initMobile();
    startRouter();
    tryRestoreSession();
  }, []);

  if (appView.value === "re-permission") {
    return (
      <RePermission
        folderName={folderName.value ?? "your folder"}
        onReopen={reRequestPermission}
        onPickNew={openFolder}
      />
    );
  }

  if (appView.value === "webdav-reconnect") {
    return (
      <WebDavReconnect
        serverUrl={savedWebDavConfig.value?.url ?? ""}
        onReconnect={retryWebDavConnection}
        onChangeServer={changeServer}
      />
    );
  }

  if (appView.value === "loading") {
    return (
      <LoadingScreen
        state={appLoading.value}
        onRetry={retryLoad}
        onChangeStorage={changeStorageFromError}
      />
    );
  }

  if (appView.value === "onboarding") {
    return (
      <Onboarding
        onOpenFolder={fsAccessSupported ? openFolder : undefined}
        onConnectWebDav={connectWebDav}
        showLocalTab={fsAccessSupported}
      />
    );
  }

  return <Layout />;
}
