import { signal } from "@preact/signals";

export type SaveStatus = "saved" | "saving" | "unsaved" | "idle";

/** Current save status for the active note. */
export const saveStatus = signal<SaveStatus>("idle");

/** Current word count for the active note. */
export const wordCount = signal(0);

/** Count words in a string. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
