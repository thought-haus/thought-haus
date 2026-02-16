import type { StorageBackend } from "@thought-haus/core";
import { favoriteIds } from "./favorite-store.ts";
import { notesMap } from "../notes/note-store.ts";

const APP_DIR = ".thoughthouse";
const FAVORITES_FILE = "favorites.json";

interface FavoritesFileSchema {
  version: number;
  favorites: string[];
}

export async function loadFavorites(backend: StorageBackend): Promise<void> {
  try {
    const raw = await backend.readFromDir(APP_DIR, FAVORITES_FILE);
    const data: FavoritesFileSchema = JSON.parse(raw);
    if (data.version === 1 && Array.isArray(data.favorites)) {
      favoriteIds.value = data.favorites;
    }
  } catch {
    // File missing or corrupt — start with empty favorites
    favoriteIds.value = [];
  }
}

export async function saveFavorites(backend: StorageBackend): Promise<void> {
  const map = notesMap.value;
  const validIds = favoriteIds.value.filter((id) => map.has(id));

  if (validIds.length !== favoriteIds.value.length) {
    favoriteIds.value = validIds;
  }

  const data: FavoritesFileSchema = { version: 1, favorites: validIds };
  await backend.writeToDir(APP_DIR, FAVORITES_FILE, JSON.stringify(data, null, 2));
}
