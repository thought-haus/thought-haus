import { signal, computed } from "@preact/signals";
import { notesMap } from "../notes/note-store.ts";
import { storageBackend } from "../lib/app-state.ts";
import { debounce } from "../lib/debounce.ts";
import { saveFavorites } from "./favorite-persistence.ts";
import type { Note } from "@thought-haus/core";

/** Ordered list of favorited note IDs. Most recently added first. */
export const favoriteIds = signal<string[]>([]);

/** Favorite IDs resolved to Note objects. Stale IDs silently excluded. */
export const favoriteNotes = computed<Note[]>(() => {
  const map = notesMap.value;
  const notes: Note[] = [];
  for (const id of favoriteIds.value) {
    const note = map.get(id);
    if (note) notes.push(note);
  }
  return notes;
});

/** Whether favorites section is collapsed in sidebar. */
export const favoritesCollapsed = signal(false);

const COLLAPSED_KEY = "th-favorites-collapsed";

export function initFavoritesCollapsed(): void {
  try {
    const saved = localStorage.getItem(COLLAPSED_KEY);
    if (saved === "true") favoritesCollapsed.value = true;
  } catch { /* localStorage unavailable */ }
}

export function setFavoritesCollapsed(collapsed: boolean): void {
  favoritesCollapsed.value = collapsed;
  try {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  } catch { /* localStorage unavailable */ }
}

const persistFavorites = debounce(() => {
  const backend = storageBackend.value;
  if (backend) saveFavorites(backend).catch(() => {});
}, 300);

export function isFavorite(id: string): boolean {
  return favoriteIds.value.includes(id);
}

export function addFavorite(id: string): void {
  if (favoriteIds.value.includes(id)) return;
  favoriteIds.value = [id, ...favoriteIds.value];
  persistFavorites();
}

export function removeFavorite(id: string): void {
  const ids = favoriteIds.value;
  if (!ids.includes(id)) return;
  favoriteIds.value = ids.filter((x) => x !== id);
  persistFavorites();
}

export function toggleFavorite(id: string): void {
  if (isFavorite(id)) removeFavorite(id);
  else addFavorite(id);
}

export function moveFavorite(fromIndex: number, toIndex: number): void {
  const ids = [...favoriteIds.value];
  const [moved] = ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, moved);
  favoriteIds.value = ids;
  persistFavorites();
}
