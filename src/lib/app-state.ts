import { signal, computed } from "@preact/signals";

export type AppView = "onboarding" | "re-permission" | "main";

/** The current top-level view of the app. */
export const appView = signal<AppView>("onboarding");

/** Whether the browser is compatible (File System Access API). */
export const isBrowserCompatible = signal(true);

/** The name of the currently opened folder. */
export const folderName = signal<string | null>(null);

/** The directory handle for the currently opened folder. */
export const directoryHandle = signal<FileSystemDirectoryHandle | null>(null);

/** A saved directory handle that needs re-permission from the user. */
export const savedHandle = signal<FileSystemDirectoryHandle | null>(null);

/** The currently selected note ID. */
export const selectedNoteId = signal<string | null>(null);

/** Whether the sidebar is collapsed. */
export const sidebarCollapsed = signal(false);

/** Derived: should we show the main editor layout? */
export const showMainLayout = computed(
  () => appView.value === "main" && isBrowserCompatible.value,
);
