# Favorites — Implementation Plan

Consolidated from product, UX, and technical specs with user decisions applied.

## Decisions Made

| Divergence | Decision |
|---|---|
| File location | `.noti/favorites.json` (subdirectory) |
| How to add | Star in editor header + `Cmd+Shift+F` (no context menus) |
| Ordering | Most recently favorited at **top** |
| Keyboard shortcut | `Cmd+Shift+F` / `Ctrl+Shift+F` from day one |
| Drag-and-drop | Yes, full DnD from day one (native HTML5) |
| Overflow | Max-height + scrollable area (not "Show N more" toggle) |

---

## Step 1: Add subdirectory read/write to StorageBackend

The existing `StorageBackend` interface has `writeBinary(dir, filename, data)` for subdirectories but no `readText`/`writeText` for subdirectory text files. We need two new methods.

### `src/storage/backend.ts` — Add to interface

```typescript
/** Read a text file from a subdirectory. */
readFromDir(dir: string, filename: string): Promise<string>;
/** Write a text file to a subdirectory (creates dir if needed). */
writeToDir(dir: string, filename: string, content: string): Promise<void>;
```

### `src/storage/local-backend.ts` — Implement

```typescript
async readFromDir(dir: string, filename: string): Promise<string> {
  const subDir = await this.dirHandle.getDirectoryHandle(dir);
  const fileHandle = await subDir.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return file.text();
}

async writeToDir(dir: string, filename: string, content: string): Promise<void> {
  const subDir = await this.dirHandle.getDirectoryHandle(dir, { create: true });
  const fileHandle = await subDir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
```

---

## Step 2: Create favorites persistence module

### `src/favorites/favorite-persistence.ts`

```typescript
import type { StorageBackend } from "../storage/backend.ts";
import { favoriteIds } from "./favorite-store.ts";
import { notesMap } from "../notes/note-store.ts";

const NOTI_DIR = ".noti";
const FAVORITES_FILE = "favorites.json";

interface FavoritesFileSchema {
  version: number;
  favorites: string[];
}

export async function loadFavorites(backend: StorageBackend): Promise<void> {
  try {
    const raw = await backend.readFromDir(NOTI_DIR, FAVORITES_FILE);
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
  const validIds = favoriteIds.value.filter(id => map.has(id));

  if (validIds.length !== favoriteIds.value.length) {
    favoriteIds.value = validIds;
  }

  const data: FavoritesFileSchema = { version: 1, favorites: validIds };
  await backend.writeToDir(NOTI_DIR, FAVORITES_FILE, JSON.stringify(data, null, 2));
}
```

---

## Step 3: Create favorites store module

### `src/favorites/favorite-store.ts`

```typescript
import { signal, computed } from "@preact/signals";
import { notesMap } from "../notes/note-store.ts";
import { storageBackend } from "../lib/app-state.ts";
import { debounce } from "../lib/debounce.ts";
import { saveFavorites } from "./favorite-persistence.ts";
import type { Note } from "../notes/note.ts";

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

const COLLAPSED_KEY = "noti-favorites-collapsed";

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

// Debounced persist (300ms for rapid DnD reordering)
const persistFavorites = debounce(() => {
  const backend = storageBackend.value;
  if (backend) saveFavorites(backend).catch(() => {});
}, 300);

export function isFavorite(id: string): boolean {
  return favoriteIds.value.includes(id);
}

export function addFavorite(id: string): void {
  if (favoriteIds.value.includes(id)) return;
  favoriteIds.value = [id, ...favoriteIds.value]; // most recent at top
  persistFavorites();
}

export function removeFavorite(id: string): void {
  const ids = favoriteIds.value;
  if (!ids.includes(id)) return;
  favoriteIds.value = ids.filter(x => x !== id);
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
```

---

## Step 4: Integrate into app initialization

### `src/ui/app.tsx` — In `openWithBackend()`

After `setNotes(notes)`:

```typescript
import { loadFavorites } from "../favorites/favorite-persistence.ts";
import { initFavoritesCollapsed } from "../favorites/favorite-store.ts";

// Inside openWithBackend, after setNotes(notes):
await loadFavorites(backend);
```

In `App()` useEffect, add `initFavoritesCollapsed()` alongside other init calls.

---

## Step 5: Integrate favorites cleanup into note deletion

### `src/notes/note-actions.ts` — In `deleteNote()`

```typescript
import { removeFavorite } from "../favorites/favorite-store.ts";

// Inside deleteNote, after removeNote(id):
removeFavorite(id);
```

### `src/storage/file-watcher.ts` — In `applyChanges()`, "deleted" case

```typescript
import { removeFavorite } from "../favorites/favorite-store.ts";

// Inside case "deleted":
removeFavorite(change.note.id);
```

---

## Step 6: Add star button to editor header

### `src/ui/editor-view.tsx`

Add star button to the left of the title input in the `titleRow`:

```tsx
import { Star } from "lucide-preact";
import { isFavorite, toggleFavorite } from "../favorites/favorite-store.ts";

// Inside the render, before the title input:
const favorited = isFavorite(note.id);

<button
  class={`${styles.starBtn} ${favorited ? styles.starBtnActive : ""}`}
  onClick={() => toggleFavorite(note.id)}
  aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
  aria-pressed={favorited}
  title={`${favorited ? "Remove from" : "Add to"} favorites (${navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Shift+F)`}
>
  <Star size={16} fill={favorited ? "currentColor" : "none"} />
</button>
```

### `src/ui/editor-view.module.css` — New styles

```css
.starBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-top: 0.375rem;
  transition: color 0.15s ease, background 0.15s ease, transform 0.2s ease-out;
}

.starBtn:hover {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.starBtnActive {
  color: var(--color-accent);
}

.starBtnActive:hover {
  color: var(--color-danger);
  background: var(--color-danger-subtle);
}
```

---

## Step 7: Add keyboard shortcut

### `src/ui/layout.tsx` — In keyboard shortcuts useEffect

```typescript
import { toggleFavorite } from "../favorites/favorite-store.ts";

// Add to handleKeyDown:
if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
  e.preventDefault();
  const noteId = selectedNoteId.value;
  if (noteId) toggleFavorite(noteId);
}
```

---

## Step 8: Add favorites section to sidebar

### `src/ui/sidebar.tsx` — New FavoritesSection component

Between search bar and "All Notes" row, hidden during search:

```tsx
import {
  favoriteNotes,
  favoritesCollapsed,
  setFavoritesCollapsed,
  moveFavorite,
} from "../favorites/favorite-store.ts";
import { Star, ChevronRight, ChevronDown, X } from "lucide-preact";

// Module-level DnD state (not reactive)
let dragFromIndex = -1;

function FavoriteItem({ note, index, isSelected, onSelect, onRemove }) {
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);
  const totalCount = favoriteNotes.value.length;

  return (
    <button
      class={`${styles.favoriteItem} ${isSelected ? styles.favoriteItemSelected : ""}`}
      draggable
      role="listitem"
      aria-label={`${note.title}, favorited`}
      onDragStart={() => { dragFromIndex = index; }}
      onDragOver={(e) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDropPosition(e.clientY < rect.top + rect.height / 2 ? "above" : "below");
      }}
      onDragLeave={() => setDropPosition(null)}
      onDrop={(e) => {
        e.preventDefault();
        setDropPosition(null);
        const toIndex = dropPosition === "above" ? index : index + 1;
        if (dragFromIndex !== -1 && dragFromIndex !== toIndex) {
          moveFavorite(dragFromIndex, toIndex > dragFromIndex ? toIndex - 1 : toIndex);
        }
        dragFromIndex = -1;
      }}
      onDragEnd={() => { dragFromIndex = -1; setDropPosition(null); }}
      onClick={() => onSelect(note.id)}
      onKeyDown={(e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          onRemove(note.id);
        }
        if (e.ctrlKey && e.key === "ArrowUp" && index > 0) {
          e.preventDefault();
          moveFavorite(index, index - 1);
        }
        if (e.ctrlKey && e.key === "ArrowDown" && index < totalCount - 1) {
          e.preventDefault();
          moveFavorite(index, index + 1);
        }
      }}
    >
      {dropPosition === "above" && <div class={styles.dropIndicator} />}
      <Star size={12} fill="currentColor" class={styles.favoriteStar} />
      <div class={styles.favoriteContent}>
        <div class={styles.noteTitle}>{note.title}</div>
        {note.tags.length > 0 && (
          <div class={styles.noteTags}>
            {note.tags.map((tag) => (
              <span key={tag} class={styles.tagPill}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <button
        class={styles.favoriteRemove}
        onClick={(e) => { e.stopPropagation(); onRemove(note.id); }}
        aria-label={`Remove ${note.title} from favorites`}
      >
        <X size={12} />
      </button>
      {dropPosition === "below" && <div class={styles.dropIndicator} />}
    </button>
  );
}

function FavoritesSection({ selectedNoteId, onSelectNote }) {
  const favorites = favoriteNotes.value;
  const collapsed = favoritesCollapsed.value;

  if (favorites.length === 0) return null;

  return (
    <section class={styles.favoritesSection} aria-label="Favorites">
      <button
        class={styles.favoritesHeader}
        onClick={() => setFavoritesCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-controls="favorites-list"
      >
        {collapsed
          ? <ChevronRight size={10} />
          : <ChevronDown size={10} />}
        <span>Favorites ({favorites.length})</span>
      </button>
      {!collapsed && (
        <div id="favorites-list" role="list" class={styles.favoritesList}>
          {favorites.map((note, i) => (
            <FavoriteItem
              key={note.id}
              note={note}
              index={i}
              isSelected={note.id === selectedNoteId}
              onSelect={onSelectNote}
              onRemove={removeFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}
```

Insert `<FavoritesSection>` between search and "All Notes" in the non-searching branch of sidebar render.

---

## Step 9: Sidebar CSS additions

### `src/ui/sidebar.module.css` — New styles

```css
/* Favorites section */
.favoritesSection {
  border-bottom: 1px solid var(--color-border);
}

.favoritesHeader {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
  transition: color 0.15s ease;
}

.favoritesHeader:hover {
  color: var(--color-accent);
}

.favoritesList {
  max-height: 320px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar) transparent;
}

.favoritesList::-webkit-scrollbar {
  width: 6px;
}

.favoritesList::-webkit-scrollbar-track {
  background: transparent;
}

.favoritesList::-webkit-scrollbar-thumb {
  background: var(--color-scrollbar);
  border-radius: 3px;
}

/* Favorite item */
.favoriteItem {
  display: flex;
  align-items: flex-start;
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  padding-left: 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  border-left: 2.5px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
  position: relative;
}

.favoriteItem:hover {
  background: var(--color-note-hover);
}

.favoriteItemSelected {
  background: var(--color-accent-subtle);
  border-left-color: var(--color-accent);
}

.favoriteStar {
  flex-shrink: 0;
  color: var(--color-accent);
  margin-right: 0.5rem;
  margin-top: 0.125rem;
}

.favoriteContent {
  flex: 1;
  min-width: 0;
}

.favoriteRemove {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.125rem;
  border-radius: 4px;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.favoriteItem:hover .favoriteRemove {
  opacity: 1;
}

.favoriteRemove:hover {
  color: var(--color-danger);
  background: var(--color-danger-subtle);
}

/* Drag-and-drop indicator */
.dropIndicator {
  height: 2px;
  background: var(--color-accent);
  border-radius: 1px;
  margin: 0 0.75rem;
}
```

---

## Step 10: Tests

### `src/favorites/favorite-store.test.ts`

- `addFavorite` / `removeFavorite` / `toggleFavorite` update `favoriteIds`
- `addFavorite` adds to front of array (most recent first)
- `addFavorite` with duplicate ID is a no-op
- `removeFavorite` with unknown ID is a no-op
- `moveFavorite` correctly reorders
- `isFavorite` returns correct values
- `favoriteNotes` computed excludes IDs not in `notesMap`

### `src/favorites/favorite-persistence.test.ts`

- `loadFavorites` parses valid JSON from subdirectory
- `loadFavorites` handles missing file (returns empty)
- `loadFavorites` handles corrupt JSON (returns empty)
- `loadFavorites` handles wrong version (returns empty)
- `saveFavorites` writes correct JSON to `.noti/favorites.json`
- `saveFavorites` prunes stale IDs

---

## File Summary

| File | Action |
|---|---|
| `src/storage/backend.ts` | Add `readFromDir()`, `writeToDir()` to interface |
| `src/storage/local-backend.ts` | Implement `readFromDir()`, `writeToDir()` |
| `src/favorites/favorite-store.ts` | **New** — signals, mutations, collapse state |
| `src/favorites/favorite-persistence.ts` | **New** — load/save `.noti/favorites.json` |
| `src/favorites/favorite-store.test.ts` | **New** — unit tests for store |
| `src/favorites/favorite-persistence.test.ts` | **New** — unit tests for persistence |
| `src/ui/app.tsx` | Add `loadFavorites()` call + `initFavoritesCollapsed()` |
| `src/ui/layout.tsx` | Add `Cmd+Shift+F` keyboard shortcut |
| `src/ui/editor-view.tsx` | Add star button to left of title |
| `src/ui/editor-view.module.css` | Add `.starBtn` styles |
| `src/ui/sidebar.tsx` | Add `FavoritesSection` + `FavoriteItem` components |
| `src/ui/sidebar.module.css` | Add favorites section, item, DnD, header styles |
| `src/notes/note-actions.ts` | Add `removeFavorite(id)` to `deleteNote()` |
| `src/storage/file-watcher.ts` | Add `removeFavorite(id)` to "deleted" case |

**Total: 4 new files, 10 modified files.**

---

## Implementation Order

1. **Backend** (Step 1) — `readFromDir`/`writeToDir` on interface + LocalBackend
2. **Favorites core** (Steps 2-3) — persistence + store modules
3. **App init** (Step 4) — load favorites on startup
4. **Cleanup hooks** (Step 5) — delete/watcher integration
5. **Editor star** (Step 6) — star button in header
6. **Keyboard shortcut** (Step 7) — `Cmd+Shift+F`
7. **Sidebar section** (Steps 8-9) — FavoritesSection with DnD + CSS
8. **Tests** (Step 10) — store + persistence tests
