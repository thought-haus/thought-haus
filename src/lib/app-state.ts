import { signal, computed } from "@preact/signals";
import type { StorageBackend } from "../storage/backend.ts";

export type AppView = "onboarding" | "re-permission" | "webdav-reconnect" | "main";

export type SortMode = "created" | "title" | "modified";
export type SortDirection = "asc" | "desc";

export type ThemeMode = "light" | "dark" | "system";

const THEME_KEY = "th-theme";

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

const SORT_KEY = "th-sort";

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

/** The active storage backend for the currently opened folder. */
export const storageBackend = signal<StorageBackend | null>(null);

/** A saved directory handle that needs re-permission from the user. */
export const savedHandle = signal<FileSystemDirectoryHandle | null>(null);

/** Saved WebDAV config for reconnection screen. */
export const savedWebDavConfig = signal<{ url: string; username: string; password: string } | null>(null);

/** The currently selected note ID. */
export const selectedNoteId = signal<string | null>(null);

/** Whether the sidebar is collapsed. */
export const sidebarCollapsed = signal(false);

/** The sidebar width in pixels. */
const SIDEBAR_WIDTH_KEY = "th-sidebar-width";
const DEFAULT_SIDEBAR_WIDTH = 300;

export const sidebarWidth = signal(DEFAULT_SIDEBAR_WIDTH);

/** Set the sidebar width and persist it. */
export function setSidebarWidth(width: number) {
  sidebarWidth.value = width;
  try {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
  } catch { /* localStorage unavailable */ }
}

/** Initialize sidebar width from localStorage. */
export function initSidebarWidth(): void {
  try {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (saved) {
      const width = Number(saved);
      if (width >= 200 && width <= 800) {
        sidebarWidth.value = width;
      }
    }
  } catch { /* corrupt or unavailable */ }
}

/** The agent panel width in pixels. */
const AGENT_PANEL_WIDTH_KEY = "th-agent-panel-width";
const DEFAULT_AGENT_PANEL_WIDTH = 420;

export const agentPanelWidth = signal(DEFAULT_AGENT_PANEL_WIDTH);

/** Set the agent panel width and persist it. */
export function setAgentPanelWidth(width: number) {
  agentPanelWidth.value = width;
  try {
    localStorage.setItem(AGENT_PANEL_WIDTH_KEY, String(width));
  } catch { /* localStorage unavailable */ }
}

/** Initialize agent panel width from localStorage. */
export function initAgentPanelWidth(): void {
  try {
    const saved = localStorage.getItem(AGENT_PANEL_WIDTH_KEY);
    if (saved) {
      const width = Number(saved);
      if (width >= 280 && width <= 900) {
        agentPanelWidth.value = width;
      }
    }
  } catch { /* corrupt or unavailable */ }
}

/** Derived: should we show the main editor layout? */
export const showMainLayout = computed(
  () => appView.value === "main" && isBrowserCompatible.value,
);
