# Favorites: Product Requirements

## Feature Name: **Favorites**

"Favorites" wins over the alternatives:
- **Pins** — too casual, implies temporary placement (like pinned tabs)
- **Bookmarks** — collides with browser bookmarks; Obsidian uses this but it's a separate tab, not inline
- **Shortcuts** — implies keyboard shortcuts; confusing in a browser app context
- **Favorites** — universally understood, used by Linear and Notion, implies lasting importance without being overly formal

## Core User Stories

1. **Quick access to important notes.** "I have 5-8 notes I open daily (meeting notes, project plans, a personal scratchpad). I want them always at the top of my sidebar so I never scroll or search for them."

2. **Curated workspace.** "I want to shape my sidebar to reflect what I'm currently working on. When a project ends, I unfavorite those notes and favorite the next project's notes."

3. **Zero-friction toggling.** "Adding or removing a favorite should take one click, not a menu dive. I shouldn't have to think about it."

## Sidebar Placement

Favorites section sits **at the top of the sidebar**, between the search bar and the "All Notes" header. This matches Linear's pattern and gives favorites the most prominent position.

```
┌─────────────────────┐
│  Search (Cmd+K)     │
├─────────────────────┤
│  ★ Favorites (3)    │  ← new section, collapsible
│    Meeting Notes    │
│    Project Plan     │
│    Daily Log        │
├─────────────────────┤
│  All Notes (47)  + ↕│
│  Tags: ...          │
│  ── Today ──        │
│    Note A           │
│    Note B           │
│  ── Yesterday ──    │
│    ...              │
├─────────────────────┤
│  🌙 Dark   🤖 AI    │
└─────────────────────┘
```

When the favorites list is empty, the section is hidden entirely — no empty state, no onboarding prompt. It appears the first time a note is favorited.

## Interactions

### Adding a favorite
- **Primary:** Right-click a note in the sidebar → context menu with "Add to Favorites" option
- **Secondary:** Star icon (☆) appears on hover over any note item in the sidebar note list. Click to toggle.
- **Editor:** A star icon in the editor header (next to Attach/Delete buttons) toggles favorite status for the active note.

### Removing a favorite
- **In favorites section:** On hover, show an × button (consistent with tag removal pattern). Click to unfavorite.
- **In note list:** The star icon (★) appears filled for favorited notes. Click to unfavorite.
- **Editor:** Same star icon in header toggles off.
- **Right-click:** "Remove from Favorites" replaces "Add to Favorites" in context menu.

### Collapsing
- The "Favorites" section header is clickable to collapse/expand the list.
- Collapsed state is persisted to localStorage (like sidebar width).
- When collapsed, the header still shows the count: "Favorites (3)".

### Ordering
- Favorites are displayed in the order they were added (most recently favorited at the bottom).
- No manual reordering in v1.

### Favorited notes in the main note list
- Favorited notes still appear in the normal note list (they are not removed from it). This avoids confusion about "where did my note go?"
- A small filled star indicator (★) appears next to the title of favorited notes in the main list, so the user knows at a glance which are favorited.

## Persistence

Favorites are stored in a `.noti/favorites.json` file inside the user's notes folder.

```json
{
  "version": 1,
  "favorites": [
    "20240322T131856",
    "20240415T092100",
    "20240501T143022"
  ]
}
```

**Why a separate file, not frontmatter:**
- Ordering is a list concern, not a per-note concern. Storing order in frontmatter would require reading every note to reconstruct the list and would make ordering fragile.
- Frontmatter changes trigger file watcher events and modify `lastModified`, which would pollute the "Last modified" sort with non-content changes.
- A separate config file keeps favorites metadata cleanly separated from note content, just like Obsidian stores bookmarks in its vault config.

**Why `.noti/` subdirectory:**
- Follows the convention of hidden config directories (`.git/`, `.obsidian/`, `.vscode/`).
- Keeps the user's notes folder clean — they see their `.md` files, not config noise.
- Allows future Noti config to live here too (e.g., custom sort preferences, sidebar state) without proliferating root-level config files.

**File handling:**
- Created lazily on first favorite action. No file = no favorites.
- Read during directory scan (alongside note scanning).
- Written immediately on any favorites change (add, remove). No debounce needed since changes are infrequent.
- Invalid note IDs in the file (e.g., referencing deleted notes) are silently filtered out on read and cleaned up on next write.
- The file watcher should detect external changes to `favorites.json` and reload.

## State Management

A new signal module `src/favorites/favorites-store.ts`:
- `favorites` signal: `Signal<string[]>` — ordered list of note IDs
- `favoritesSet` computed: `ReadonlySet<string>` — for O(1) lookup ("is this note favorited?")
- `addFavorite(id)`, `removeFavorite(id)`, `isFavorite(id)`, `toggleFavorite(id)` — plain functions
- `loadFavorites()`, `persistFavorites()` — read/write to storage backend

## Scope Boundaries (v1)

### In scope
- Add/remove favorites via sidebar hover icon, context menu, and editor header
- Favorites section at top of sidebar with collapse/expand
- Persistence in `.noti/favorites.json`
- Small star indicator on favorited notes in main list
- Graceful handling of deleted/missing notes in favorites list

### Out of scope
- Drag-and-drop reordering of favorites
- Keyboard shortcut to favorite/unfavorite
- Favoriting tags, searches, or anything other than individual notes
- Favorites in search results (search results are ranked by relevance, not favorites)
- Syncing favorites across devices (no sync exists in the app at all)
- Limit on number of favorites (users self-regulate; if they favorite everything, nothing is a favorite)

## Success Criteria

1. **Discoverability:** A new user can discover how to favorite a note within 10 seconds of looking at the sidebar (hover icon is visible, context menu is intuitive).
2. **Speed:** Favoriting/unfavoriting a note is a single click with instant visual feedback. No loading states.
3. **Persistence:** Favorites survive app reload, tab close, and re-opening the same folder.
4. **Non-destructive:** Favorites file is ignorable by other tools. Deleting `.noti/favorites.json` simply clears favorites — no data loss, no errors.
5. **Clean integration:** The favorites section feels native to the existing sidebar design, not bolted on. Uses the same typography, spacing, and interaction patterns as the rest of the sidebar.

## Design Principles

- **Invisible until needed.** No favorites section when the list is empty. No onboarding tooltip.
- **One-click everything.** Add, remove, collapse — all single-click.
- **Notes stay in place.** Favoriting is an annotation, not a move. Notes remain in the main list.
- **File system is truth.** The `.noti/favorites.json` file is the single source of truth. No IndexedDB cache.
