import { signal, computed } from "@preact/signals";

export type AppView = "onboarding" | "main";

/** The current top-level view of the app. */
export const appView = signal<AppView>("onboarding");

/** Whether the browser is compatible (File System Access API). */
export const isBrowserCompatible = signal(true);

/** The name of the currently opened folder. */
export const folderName = signal<string | null>(null);

/** Derived: should we show the main editor layout? */
export const showMainLayout = computed(
  () => appView.value === "main" && isBrowserCompatible.value,
);
