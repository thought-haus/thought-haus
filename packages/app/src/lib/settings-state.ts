import { signal } from "@preact/signals";

export type SettingsSection = "appearance" | "ai" | "storage" | "about";

/** Whether the settings modal is open. */
export const settingsOpen = signal(false);

/** The active settings section. */
export const settingsSection = signal<SettingsSection>("appearance");

export function openSettings(section?: SettingsSection): void {
  if (section) settingsSection.value = section;
  settingsOpen.value = true;
}

export function closeSettings(): void {
  settingsOpen.value = false;
}
