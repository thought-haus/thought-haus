import { signal, computed, effect } from "@preact/signals";
import { notesMap } from "../notes/note-store.ts";
import { selectedNoteId } from "../lib/app-state.ts";
import type { Note } from "@thought-haus/core";

const STORAGE_KEY = "th-recently-viewed-note-ids";
const MAX_RECENTLY_VIEWED = 5;

let stopTracking: (() => void) | null = null;

export const recentlyViewedIds = signal<string[]>([]);

export const recentlyViewedNotes = computed<Note[]>(() => {
  const map = notesMap.value;
  return recentlyViewedIds.value.flatMap((id) => {
    const note = map.get(id);
    return note ? [note] : [];
  });
});

export function initRecentlyViewed(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    recentlyViewedIds.value = parsed
      .filter((id): id is string => typeof id === "string")
      .slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    recentlyViewedIds.value = [];
  }
}

export function startRecentlyViewedTracking(): void {
  stopTracking?.();
  stopTracking = effect(() => {
    const id = selectedNoteId.value;
    if (!id) return;
    trackRecentlyViewed(id);
  });
}

export function trackRecentlyViewed(id: string): void {
  const ids = recentlyViewedIds.peek().filter((existingId) => existingId !== id);
  recentlyViewedIds.value = [id, ...ids].slice(0, MAX_RECENTLY_VIEWED);
  persistRecentlyViewed();
}

function persistRecentlyViewed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewedIds.peek()));
  } catch {
    // localStorage unavailable
  }
}
