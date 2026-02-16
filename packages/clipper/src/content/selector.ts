/** Check if the user has text selected on the page. */
export function hasSelection(): boolean {
  const selection = window.getSelection();
  return selection !== null && !selection.isCollapsed && selection.toString().trim().length > 0;
}

/** Get the plain text of the current selection. */
export function getSelectionText(): string {
  return window.getSelection()?.toString() ?? "";
}

/** Get word count from text. */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Estimate reading time in minutes. */
export function readingTime(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 200));
}
