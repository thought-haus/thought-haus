import { useEffect } from "preact/hooks";
import {
  appView,
  isBrowserCompatible,
  folderName,
  storageBackend,
  savedHandle,
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
import { scanNotes } from "../storage/scan.ts";
import { setNotes } from "../notes/note-store.ts";
import { createWelcomeNote } from "../notes/note-actions.ts";
import { buildIndex } from "../search/search-engine.ts";
import { parseFrontMatter } from "../notes/frontmatter.ts";
import { saveSearchIndex } from "../search/search-persistence.ts";
import { serializeIndex } from "../search/search-engine.ts";
import { startWatcher } from "../storage/file-watcher.ts";
import { startRouter, applyPendingHash } from "../lib/router.ts";
import { BrowserCheck } from "./browser-check.tsx";
import { Onboarding } from "./onboarding.tsx";
import { RePermission } from "./re-permission.tsx";
import { Layout } from "./layout.tsx";
import type { StorageBackend } from "../storage/backend.ts";

if (!isFileSystemAccessSupported()) {
  isBrowserCompatible.value = false;
}

let stopWatcher: (() => void) | null = null;

async function openWithBackend(backend: StorageBackend): Promise<void> {
  storageBackend.value = backend;
  folderName.value = backend.name;

  // Persist handle for session restore (Local-specific)
  const raw = (backend as LocalBackend).getRawHandle?.();
  if (raw) {
    await saveDirectoryHandle(raw);
  }

  const notes = await scanNotes(backend);
  setNotes(notes);
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
      return { id: note.id, title: note.title, tags: note.tags, body };
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

export function App() {
  useEffect(() => {
    initTheme();
    initSort();
    initSidebarWidth();
    initAgentPanelWidth();
    startRouter();
    tryRestoreSession();
  }, []);

  if (!isBrowserCompatible.value) {
    return <BrowserCheck />;
  }

  if (appView.value === "re-permission") {
    return (
      <RePermission
        folderName={folderName.value ?? "your folder"}
        onReopen={reRequestPermission}
        onPickNew={openFolder}
      />
    );
  }

  if (appView.value === "onboarding") {
    return <Onboarding onOpenFolder={openFolder} />;
  }

  return <Layout />;
}
