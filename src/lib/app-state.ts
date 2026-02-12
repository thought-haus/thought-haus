import { signal, computed } from "@preact/signals";

export type AppView = "onboarding" | "re-permission" | "main";

export type SortMode = "created" | "title" | "modified";
export type SortDirection = "asc" | "desc";

export type ThemeMode = "light" | "dark" | "system";

const THEME_KEY = "noti-theme";

/** The user's chosen theme mode. */
export const themeMode = signal<ThemeMode>("system");

function prefersDark(): boolean {
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** The resolved theme after applying system preference. */
export const resolvedTheme = computed<"light" | "dark">(() => {
  if (themeMode.value !== "system") return themeMode.value;
  return prefersDark() ? "dark" : "light";
});

function applyTheme() {
  document.documentElement.dataset.theme = resolvedTheme.value;
}

/** Set the theme mode and persist it. */
export function setTheme(mode: ThemeMode) {
  themeMode.value = mode;
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    // localStorage unavailable (e.g. test environment)
  }
  applyTheme();
}

/** Initialize theme from localStorage and listen for OS changes. */
export function initTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === "light" || saved === "dark" || saved === "system") {
      themeMode.value = saved;
    }
  } catch {
    // localStorage unavailable (e.g. test environment)
  }
  applyTheme();

  if (typeof window.matchMedia === "function") {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (themeMode.value === "system") applyTheme();
      });
  }
}

/** The current sort mode for the note list. */
export const sortMode = signal<SortMode>("created");

/** The current sort direction. */
export const sortDirection = signal<SortDirection>("desc");

const SORT_KEY = "noti-sort";

export const SORT_DEFAULTS: Record<SortMode, SortDirection> = {
  created: "desc",
  title: "asc",
  modified: "desc",
};

/** Set the sort mode and direction, persisting to localStorage. */
export function setSort(mode: SortMode, direction: SortDirection): void {
  sortMode.value = mode;
  sortDirection.value = direction;
  try {
    localStorage.setItem(SORT_KEY, JSON.stringify({ field: mode, direction }));
  } catch { /* localStorage unavailable */ }
}

/** Initialize sort from localStorage. */
export function initSort(): void {
  try {
    const raw = localStorage.getItem(SORT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.field in SORT_DEFAULTS) {
        sortMode.value = parsed.field;
        sortDirection.value = parsed.direction === "asc" ? "asc" : "desc";
      }
    }
  } catch { /* corrupt or unavailable */ }
}

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
