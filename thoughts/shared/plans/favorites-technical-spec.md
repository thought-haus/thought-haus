# Favorites — Technical Specification

## Overview

This document defines the technical architecture for implementing a favorites feature in Noti. Favorites allow users to pin notes to a dedicated section at the top of the sidebar with manual ordering via drag-and-drop.

## 1. Persistence Format

### File: `.noti-favorites.json`

A JSON file stored at the root of the user's notes folder, alongside their `.md` files. The `scanNotes()` function in `src/storage/scan.ts` already filters for `.md` files, so this JSON file will be invisible to the note model.

**Why root-level rather than a subdirectory?** The existing `StorageBackend` interface supports `read(filename)` and `write(filename, content)` for root-level text files. Using these avoids any backend interface changes. A `.noti/` config directory can be introduced later if more config files are needed.

**Why JSON?** Natively parseable in JS, the app already uses JSON for IndexedDB serialization, and the hand-rolled YAML parser in `frontmatter.ts` only handles simple frontmatter — not suitable for ordered lists.

### Schema

```json
{
  "version": 1,
  "favorites": [
    "20240322T131856",
    "20240401T092100",
    "meeting-notes.md"
  ]
}
```

- `version`: Schema version for forward-compatibility. Always `1` for initial implementation.
- `favorites`: Ordered array of note IDs. The array index is the display order. IDs use the same format as `Note.id` (timestamp ID for Noti-format notes, raw filename for non-Noti `.md` files).

### Size Constraints

At ~20 bytes per ID, even 500 favorites is only ~10KB. No pagination or chunking needed.

## 2. State Management

### New Signals

All favorites state lives in `src/favorites/favorite-store.ts`:

```typescript
import { signal, computed } from "@preact/signals";
import { notesMap } from "../notes/note-store.ts";
import type { Note } from "../notes/note.ts";

/** Ordered list of favorited note IDs. Source of truth for favorite state. */
export const favoriteIds = signal<string[]>([]);

/** Whether favorites have been loaded from disk. */
export const favoritesLoaded = signal(false);

/** Favorite IDs resolved to Note objects. Stale IDs (deleted notes) are silently excluded. */
export const favoriteNotes = computed<Note[]>(() => {
  const map = notesMap.value;
  const notes: Note[] = [];
  for (const id of favoriteIds.value) {
    const note = map.get(id);
    if (note) notes.push(note);
  }
  return notes;
});
```

### Signal Interactions

```
favoriteIds  ──┐
                ├──► favoriteNotes (computed)
notesMap     ──┘

favoriteIds  ──────► isFavorite() (read helper)
```

`favoriteNotes` depends on both `favoriteIds` and `notesMap`. This means:
- When a note is deleted from `notesMap`, `favoriteNotes` automatically excludes it on next access (no explicit cleanup needed for the computed value).
- When favorites are reordered, `favoriteNotes` recalculates with the new order.

The `favoriteIds` signal still holds stale IDs until the next persist cycle cleans them. This is intentional — it allows an undo window and avoids unnecessary writes on transient states.

## 3. Module Structure

```
src/favorites/
  favorite-store.ts        — Signals, computed values, mutation functions
  favorite-persistence.ts  — Read/write .noti-favorites.json via StorageBackend
```

Two files, clean separation of concerns:
- `favorite-store.ts` owns the reactive state and exposes the public API. It never touches the backend directly.
- `favorite-persistence.ts` handles serialization/deserialization and file I/O. It's the only module that knows about the file format.

This follows the existing pattern where `note-store.ts` owns reactive state and `scan.ts` / `note-actions.ts` handle persistence.

## 4. Loading

### When

Favorites are loaded during app initialization, inside `openWithBackend()` in `src/ui/app.tsx`, **after** `scanNotes()` and `setNotes()` complete. This ensures `notesMap` is populated before `favoriteNotes` is first computed.

```typescript
// In openWithBackend() — after setNotes(notes):
async function openWithBackend(backend: StorageBackend): Promise<void> {
  // ... existing: scanNotes, setNotes, appView = "main" ...

  await loadFavorites(backend);  // <-- new

  // ... existing: buildIndex, startWatcher ...
}
```

### How

```typescript
// favorite-persistence.ts
const FAVORITES_FILE = ".noti-favorites.json";

interface FavoritesFileSchema {
  version: number;
  favorites: string[];
}

export async function loadFavorites(backend: StorageBackend): Promise<void> {
  try {
    const raw = await backend.read(FAVORITES_FILE);
    const data: FavoritesFileSchema = JSON.parse(raw);
    if (data.version === 1 && Array.isArray(data.favorites)) {
      favoriteIds.value = data.favorites;
    }
  } catch {
    // File doesn't exist or is corrupt — start with empty favorites.
    favoriteIds.value = [];
  }
  favoritesLoaded.value = true;
}
```

### Error Handling

- **File missing**: Treated as empty favorites. No file is created until the user first adds a favorite.
- **File corrupt/unparseable**: Same as missing — silently start with empty. A warning can be logged to console in dev mode.
- **Wrong version**: Currently only version `1` exists. If `version !== 1`, treat as empty. Future versions can add migration logic.

## 5. Syncing

### Note Deletion → Favorites Cleanup

When a note is deleted, its ID should be removed from `favoriteIds` and the file rewritten. This happens in two places:

**a. User-initiated deletion** (`note-actions.ts: deleteNote`):

```typescript
export async function deleteNote(id: string): Promise<boolean> {
  // ... existing delete logic ...
  removeFavorite(id);  // <-- new: also unfavorite
  return true;
}
```

**b. External deletion detected by file watcher** (`file-watcher.ts: applyChanges`):

```typescript
case "deleted": {
  removeNote(change.note.id);
  removeFromIndex(change.note.id);
  removeFavoriteIfPresent(change.note.id);  // <-- new
  // ...
}
```

### Note Rename → No Action Needed

Note IDs are immutable (the timestamp portion of the filename). When a note is renamed via `renameNote()`, the filename changes but the ID stays the same. So favorites are unaffected by renames.

### Stale ID Pruning

On load, `favoriteNotes` (computed) automatically excludes IDs not in `notesMap`. The raw `favoriteIds` array may contain stale entries until the next write. This is fine — stale IDs are harmless (they occupy a few bytes in the JSON and are invisible in the UI).

To keep the file clean, `saveFavorites()` prunes stale IDs before writing:

```typescript
export async function saveFavorites(backend: StorageBackend): Promise<void> {
  const map = notesMap.value;
  const validIds = favoriteIds.value.filter(id => map.has(id));

  // Update signal if any were pruned
  if (validIds.length !== favoriteIds.value.length) {
    favoriteIds.value = validIds;
  }

  const data: FavoritesFileSchema = { version: 1, favorites: validIds };
  await backend.write(FAVORITES_FILE, JSON.stringify(data, null, 2));
}
```

### File Watcher — External Favorites Edits

The favorites file is not a `.md` file, so the existing `scanNotes`-based file watcher won't detect changes to it. For v1, this is acceptable — favorites are only modified through the app UI. If a user edits the JSON file externally, their changes will be picked up on the next app session (when `loadFavorites` runs).

If needed later, we can add a secondary watch on the favorites file or detect changes during the poll cycle by checking the file's `lastModified`.

## 6. API Surface

### `src/favorites/favorite-store.ts` — Public Exports

```typescript
// ── Signals (read-only for consumers) ──
export const favoriteIds: Signal<string[]>;
export const favoriteNotes: ReadonlySignal<Note[]>;
export const favoritesLoaded: Signal<boolean>;

// ── Query ──
export function isFavorite(id: string): boolean;

// ── Mutations (all auto-persist) ──
export function addFavorite(id: string): void;
export function removeFavorite(id: string): void;
export function moveFavorite(fromIndex: number, toIndex: number): void;
export function toggleFavorite(id: string): void;
```

### Mutation Details

Each mutation updates `favoriteIds` synchronously (for instant UI feedback) and triggers an async persist. Persistence is **debounced** (300ms) to coalesce rapid reordering via drag-and-drop.

```typescript
import { debounce } from "../lib/debounce.ts";
import { storageBackend } from "../lib/app-state.ts";
import { saveFavorites } from "./favorite-persistence.ts";

const persistFavorites = debounce(() => {
  const backend = storageBackend.value;
  if (backend) saveFavorites(backend).catch(() => {});
}, 300);

export function addFavorite(id: string): void {
  if (favoriteIds.value.includes(id)) return;
  favoriteIds.value = [...favoriteIds.value, id];
  persistFavorites();
}

export function removeFavorite(id: string): void {
  const ids = favoriteIds.value;
  if (!ids.includes(id)) return;
  favoriteIds.value = ids.filter(x => x !== id);
  persistFavorites();
}

export function moveFavorite(fromIndex: number, toIndex: number): void {
  const ids = [...favoriteIds.value];
  const [moved] = ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, moved);
  favoriteIds.value = ids;
  persistFavorites();
}

export function toggleFavorite(id: string): void {
  if (isFavorite(id)) {
    removeFavorite(id);
  } else {
    addFavorite(id);
  }
}

export function isFavorite(id: string): boolean {
  return favoriteIds.value.includes(id);
}
```

### `src/favorites/favorite-persistence.ts` — Public Exports

```typescript
export function loadFavorites(backend: StorageBackend): Promise<void>;
export function saveFavorites(backend: StorageBackend): Promise<void>;
```

## 7. Integration Points

### `src/ui/app.tsx`

Add `loadFavorites()` call in `openWithBackend()`:

```diff
+ import { loadFavorites } from "../favorites/favorite-persistence.ts";

  async function openWithBackend(backend: StorageBackend): Promise<void> {
    // ... scanNotes, setNotes ...
+   await loadFavorites(backend);
    // ... buildIndex, startWatcher ...
  }
```

### `src/notes/note-actions.ts`

Remove favorite on note deletion:

```diff
+ import { removeFavorite } from "../favorites/favorite-store.ts";

  export async function deleteNote(id: string): Promise<boolean> {
    // ... existing delete logic ...
+   removeFavorite(id);
    return true;
  }
```

### `src/storage/file-watcher.ts`

Clean favorites when external deletions are detected:

```diff
+ import { removeFavorite } from "../favorites/favorite-store.ts";

  case "deleted": {
    removeNote(change.note.id);
    removeFromIndex(change.note.id);
+   removeFavorite(change.note.id);
    // ...
  }
```

### `src/ui/sidebar.tsx`

The sidebar requires the most changes. High-level structure:

```
Sidebar
├── SearchBar
├── (if searching) SearchResults
├── (else)
│   ├── AllNotes header + SortButton + NewNote
│   ├── Tags section
│   ├── **FavoritesSection**  ◄── NEW
│   │   ├── section header ("Favorites")
│   │   └── FavoriteNoteItem[] (draggable)
│   └── NoteList (all notes, grouped by date)
```

New imports in `sidebar.tsx`:

```typescript
import { favoriteNotes, isFavorite, toggleFavorite } from "../favorites/favorite-store.ts";
```

The `NoteItem` component gets a star/heart toggle button (only visible on hover or when favorited). The `FavoritesSection` renders `favoriteNotes.value` with drag-and-drop reordering.

### `src/ui/sidebar.module.css`

New CSS classes needed:
- `.favoritesSection` — container for the favorites section
- `.favoritesSectionHeader` — "Favorites" label
- `.favoriteItem` — note item within favorites (extends `.noteItem`)
- `.favoriteToggle` — star/pin button on each note item
- `.dragOver` — visual feedback during drag reorder

## 8. Drag-and-Drop Reordering

### Approach: Native HTML5 Drag and Drop

No external library needed. The favorites list is a short, single-column list of items. HTML5 DnD is well-suited for this.

### Implementation

Each `FavoriteNoteItem` gets:
- `draggable="true"`
- `onDragStart`: Store the dragged item's index in a module-level variable (not `dataTransfer` — we don't need cross-window support).
- `onDragOver`: `e.preventDefault()` to allow drop. Calculate insertion position from mouse Y relative to item midpoint. Show a visual drop indicator (CSS border-top or border-bottom).
- `onDrop`: Call `moveFavorite(fromIndex, toIndex)`.
- `onDragEnd`: Clear drag state and visual indicators.

```typescript
// Minimal DnD state (module-scoped, not a signal — no reactivity needed)
let dragFromIndex = -1;

function FavoriteNoteItem({ note, index, isSelected, onSelect }: FavoriteItemProps) {
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);

  return (
    <button
      class={`${styles.noteItem} ${styles.favoriteItem} ${isSelected ? styles.noteItemSelected : ""}`}
      draggable
      onDragStart={() => { dragFromIndex = index; }}
      onDragOver={(e) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        setDropPosition(e.clientY < midY ? "above" : "below");
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
    >
      {/* drop indicator */}
      {dropPosition === "above" && <div class={styles.dropIndicator} />}
      <div class={styles.noteTitle}>{note.title}</div>
      {dropPosition === "below" && <div class={styles.dropIndicator} />}
    </button>
  );
}
```

### Why Not a DnD Library?

Libraries like `dnd-kit` or `react-beautiful-dnd` add significant bundle weight (20-40KB) for a single reorderable list. Native HTML5 DnD covers this use case with ~40 lines of code. The favorites list is a simple vertical list — no complex grid, no cross-container drags, no virtualization needed.

### Accessibility

For keyboard-accessible reordering, add small up/down buttons that appear on focus (or use Ctrl+ArrowUp/Down when a favorite is focused). This avoids the known accessibility gaps with HTML5 DnD:

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === "ArrowUp" && index > 0) {
    e.preventDefault();
    moveFavorite(index, index - 1);
  } else if (e.ctrlKey && e.key === "ArrowDown" && index < totalCount - 1) {
    e.preventDefault();
    moveFavorite(index, index + 1);
  }
};
```

## 9. Testing Strategy

### Unit Tests

**`src/favorites/favorite-store.test.ts`**:
- `addFavorite` / `removeFavorite` / `toggleFavorite` update `favoriteIds`
- `moveFavorite` correctly reorders
- `isFavorite` returns correct values
- `favoriteNotes` computed excludes IDs not in `notesMap`
- `addFavorite` with duplicate ID is a no-op
- `removeFavorite` with unknown ID is a no-op

**`src/favorites/favorite-persistence.test.ts`**:
- `loadFavorites` parses valid JSON
- `loadFavorites` handles missing file (returns empty)
- `loadFavorites` handles corrupt JSON (returns empty)
- `loadFavorites` handles wrong version (returns empty)
- `saveFavorites` writes correct JSON
- `saveFavorites` prunes stale IDs

### Integration Points

- `deleteNote` in `note-actions.test.ts` — verify favorite is also removed
- `applyChanges` in `file-watcher.test.ts` — verify stale favorites are cleaned on external delete

## 10. Performance Considerations

- **Signal updates**: `favoriteIds` is a flat array. Replacing it triggers recomputation of `favoriteNotes`, which is O(n) where n is the number of favorites. With typical favorite counts (<50), this is negligible.
- **`isFavorite` lookups**: Currently O(n) with `Array.includes()`. If performance becomes an issue (unlikely with <50 items), we can add a computed `Set<string>` cache. Not worth the complexity for v1.
- **Persistence debounce**: 300ms debounce on saves prevents excessive disk writes during rapid drag-and-drop reordering.
- **No re-renders for non-favorite notes**: Since `favoriteNotes` is a separate computed, changes to favorites don't cause the main note list to re-render (Preact Signals only re-render components that read the changed signal).

## 11. Edge Cases

| Scenario | Behavior |
|---|---|
| Favorited note deleted via UI | `removeFavorite` called in `deleteNote`, persisted |
| Favorited note deleted externally | File watcher removes from favorites on next poll |
| Favorites file missing on load | Start with empty favorites, no error shown |
| Favorites file corrupted | Start with empty favorites, console warning |
| Same note favorited twice | `addFavorite` checks for duplicates, no-op |
| All favorites deleted | Empty array written to file; section hidden in UI |
| Notes folder has no write permission | Favorites still work in memory; persist silently fails, retries on next mutation |
| Large number of favorites | Handled fine — JSON array, O(n) operations, practical limit ~hundreds before UX degrades |

## 12. Future Considerations (Out of Scope for v1)

- **Folder/workspace-specific favorites**: Currently one favorites list per folder (inherent, since the file is in the folder).
- **Favorite groups/categories**: The `version` field allows schema evolution.
- **Sync conflict resolution**: If multiple Noti instances edit the same folder, last-write-wins. A CRDT or merge strategy could be added later.
- **External favorites file watching**: Reload favorites when the file changes externally. Low priority since users won't typically edit this JSON by hand.
