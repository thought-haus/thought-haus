import { useEffect } from "preact/hooks";
import {
  appView,
  isBrowserCompatible,
  folderName,
  directoryHandle,
  savedHandle,
  initTheme,
} from "../lib/app-state.ts";
import { isFileSystemAccessSupported } from "../lib/browser.ts";
import {
  pickDirectory,
  saveDirectoryHandle,
  loadDirectoryHandle,
  checkPermission,
  requestPermission,
} from "../fs/directory.ts";
import { scanDirectory, readNoteContent } from "../fs/file-ops.ts";
import { setNotes } from "../notes/note-store.ts";
import { createWelcomeNote } from "../notes/note-actions.ts";
import { buildIndex } from "../search/search-engine.ts";
import { parseFrontMatter } from "../notes/frontmatter.ts";
import { saveSearchIndex } from "../search/search-persistence.ts";
import { serializeIndex } from "../search/search-engine.ts";
import { startWatcher } from "../fs/file-watcher.ts";
import { startRouter, applyPendingHash } from "../lib/router.ts";
import { BrowserCheck } from "./browser-check.tsx";
import { Onboarding } from "./onboarding.tsx";
import { RePermission } from "./re-permission.tsx";
import { Layout } from "./layout.tsx";

if (!isFileSystemAccessSupported()) {
  isBrowserCompatible.value = false;
}

let stopWatcher: (() => void) | null = null;

async function openFolderFromHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  directoryHandle.value = handle;
  folderName.value = handle.name;
  await saveDirectoryHandle(handle);
  const notes = await scanDirectory(handle);
  setNotes(notes);
  appView.value = "main";
  applyPendingHash();
  if (notes.length === 0) {
    await createWelcomeNote();
  }

  // Build search index from all note content
  const docs = await Promise.all(
    notes.map(async (note) => {
      const raw = await readNoteContent(note.fileHandle);
      const { body } = parseFrontMatter(raw);
      return { id: note.id, title: note.title, tags: note.tags, body };
    }),
  );
  buildIndex(docs);
  saveSearchIndex(serializeIndex()).catch(() => {});

  // Start watching for external changes
  if (stopWatcher) stopWatcher();
  stopWatcher = startWatcher(handle);
}

async function openFolder(): Promise<void> {
  try {
    const handle = await pickDirectory();
    await openFolderFromHandle(handle);
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
    await openFolderFromHandle(handle);
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
      await openFolderFromHandle(handle);
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
