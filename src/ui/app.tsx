import { useEffect } from "preact/hooks";
import {
  appView,
  folderName,
  storageBackend,
  savedHandle,
  savedWebDavConfig,
  selectedNoteId,
  initTheme,
  initSort,
  initSidebarWidth,
  initAgentPanelWidth,
} from "../lib/app-state.ts";
import { isFileSystemAccessSupported } from "../lib/browser.ts";
import {
  pickDirectory,
  saveDirectoryHandle,
  loadDirectoryHandle,
  checkPermission,
  requestPermission,
} from "../fs/directory.ts";
import { LocalBackend } from "../storage/local-backend.ts";
import { WebDavBackend } from "../storage/webdav-backend.ts";
import type { WebDavConfig } from "../storage/webdav-backend.ts";
import { testWebDavConnection } from "../storage/webdav-connection.ts";
import {
  saveWebDavConfig,
  loadWebDavConfig,
  saveActiveBackendType,
  loadActiveBackendType,
  clearBackendConfig,
} from "../storage/backend-persistence.ts";
import { scanNotes } from "../storage/scan.ts";
import { setNotes, clearNotes } from "../notes/note-store.ts";
import { createWelcomeNote } from "../notes/note-actions.ts";
import { buildIndex, clearSearch } from "../search/search-engine.ts";
import { parseFrontMatter } from "../notes/frontmatter.ts";
import { saveSearchIndex } from "../search/search-persistence.ts";
import { serializeIndex } from "../search/search-engine.ts";
import { startWatcher } from "../storage/file-watcher.ts";
import { loadFavorites } from "../favorites/favorite-persistence.ts";
import { favoriteIds, initFavoritesCollapsed } from "../favorites/favorite-store.ts";
import { startRouter, applyPendingHash } from "../lib/router.ts";
import { Onboarding } from "./onboarding.tsx";
import { RePermission } from "./re-permission.tsx";
import { WebDavReconnect } from "./webdav-reconnect.tsx";
import { Layout } from "./layout.tsx";
import type { StorageBackend } from "../storage/backend.ts";

const fsAccessSupported = isFileSystemAccessSupported();

let stopWatcher: (() => void) | null = null;

async function openWithBackend(backend: StorageBackend): Promise<void> {
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

  const notes = await scanNotes(backend);
  setNotes(notes);
  await loadFavorites(backend);
  appView.value = "main";
  applyPendingHash();
  if (notes.length === 0) {
    await createWelcomeNote();
  }

  // Build search index from all note content
  const docs = await Promise.all(
    notes.map(async (note) => {
      const raw = await backend.read(note.filename);
      const { body } = parseFrontMatter(raw);
      return { id: note.id, title: note.title, tags: note.tags, body, lastModified: note.lastModified };
    }),
  );
  buildIndex(docs);
  saveSearchIndex(serializeIndex()).catch(() => {});

  // Start watching for external changes
  if (stopWatcher) stopWatcher();
  stopWatcher = startWatcher(backend);
}

async function openFolder(): Promise<void> {
  try {
    const handle = await pickDirectory();
    const backend = new LocalBackend(handle);
    await openWithBackend(backend);
  } catch {
    // User cancelled the picker
  }
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

    if (!backendType) return; // Fresh install → onboarding

    if (backendType === "webdav") {
      const config = await loadWebDavConfig();
      if (!config) return;

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
    if (!handle) return;

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
