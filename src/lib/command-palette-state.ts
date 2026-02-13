import { signal } from "@preact/signals";

/** Whether the command palette is open. */
export const commandPaletteOpen = signal(false);

export function openCommandPalette(): void {
  commandPaletteOpen.value = true;
}

export function closeCommandPalette(): void {
  commandPaletteOpen.value = false;
}
