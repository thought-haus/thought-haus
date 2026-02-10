import { useEffect } from "preact/hooks";
import {
  appView,
  isBrowserCompatible,
  folderName,
  directoryHandle,
} from "../lib/app-state.ts";
import { isFileSystemAccessSupported } from "../lib/browser.ts";
import {
  pickDirectory,
  saveDirectoryHandle,
  loadDirectoryHandle,
  checkPermission,
} from "../fs/directory.ts";
import { scanDirectory } from "../fs/file-ops.ts";
import { setNotes } from "../notes/note-store.ts";
import { createWelcomeNote } from "../notes/note-actions.ts";
import { BrowserCheck } from "./browser-check.tsx";
import { Onboarding } from "./onboarding.tsx";
import { Layout } from "./layout.tsx";

if (!isFileSystemAccessSupported()) {
  isBrowserCompatible.value = false;
}

async function openFolder(): Promise<void> {
  try {
    const handle = await pickDirectory();
    directoryHandle.value = handle;
    folderName.value = handle.name;
    await saveDirectoryHandle(handle);
    const notes = await scanDirectory(handle);
    setNotes(notes);
    appView.value = "main";
    if (notes.length === 0) {
      await createWelcomeNote();
    }
  } catch {
    // User cancelled the picker
  }
}

async function tryRestoreSession(): Promise<void> {
  try {
    const handle = await loadDirectoryHandle();
    if (!handle) return;

    if (await checkPermission(handle)) {
      directoryHandle.value = handle;
      folderName.value = handle.name;
      const notes = await scanDirectory(handle);
      setNotes(notes);
      appView.value = "main";
    }
  } catch {
    // IndexedDB or permission error — fall through to onboarding
  }
}

export function App() {
  useEffect(() => {
    tryRestoreSession();
  }, []);

  if (!isBrowserCompatible.value) {
    return <BrowserCheck />;
  }

  if (appView.value === "onboarding") {
    return <Onboarding onOpenFolder={openFolder} />;
  }

  return <Layout />;
}
