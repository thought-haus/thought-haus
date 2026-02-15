# Sort Options in Sidebar — Product Spec

## Problem

The sidebar always shows notes sorted newest-first by creation date. Users with many notes need other ways to find what they're looking for — alphabetically when they remember a title but not when they wrote it, or by last modified to resurface recently edited notes. This is a P2 polish feature that makes the existing note list more useful without adding structural complexity.

## Sort Fields

Three sort options, matching the roadmap:

| Field | Source | Default direction |
|-------|--------|-------------------|
| **Date created** | `note.createdAt` (from filename timestamp, or `file.lastModified` for non-Thought.Haus files) | Newest first (desc) |
| **Title** | `note.title` (string) | A → Z (asc) |
| **Last modified** | `note.lastModified` (file system timestamp) | Most recent first (desc) |

**Date created** is the default, preserving current behavior.

**Not included:** File size. It's available on the Note type but provides no meaningful organizational value for a note-taking app. Users don't think about their notes in terms of bytes.

## Sort Direction

Each field has a single sensible default direction (see table above). Users can toggle the direction for the active sort field via a small asc/desc toggle button adjacent to the sort selector. This keeps the UI minimal — one dropdown for field, one button for direction — rather than requiring users to understand compound sort configurations.

When switching sort fields, the direction resets to that field's default. Users can then flip it if desired.

## Interaction with Existing Features

### Tag filter active

Sort applies within the filtered set. If the user filters by `#work` and sorts by title, they see only `#work` notes sorted A→Z. The sort and tag filter are independent — they compose naturally.

Implementation: `filteredNotes` computed signal already derives from `notesSorted`. Change `notesSorted` to respect the active sort field/direction, and `filteredNotes` inherits the sort automatically.

### Search active

Sort has **no effect** on search results. When `isSearchActive` is true, results are ranked by MiniSearch relevance score. The sort controls should be visually hidden or disabled during search. This is the correct UX — search relevance ranking is more useful than alphabetical order when you're searching.

When the user clears search, the previous sort selection is restored.

## Date Grouping Behavior

The sidebar currently groups notes under relative date labels ("Today", "Yesterday", "This Week", etc.) derived from `note.createdAt`.

**Decision:** Date groups are shown only when sorting by **Date created** (the default). When sorting by **Title** or **Last modified**, date groups are hidden and the list becomes a flat, ungrouped list.

Rationale: Showing "Today / Yesterday / This Week" groups makes no sense when notes are sorted alphabetically. Grouping by last-modified date would require a different grouping function and adds complexity for marginal value. A flat sorted list is clear and simple.

When sorting by **Date created** descending (the default), the grouping works exactly as it does today. When sorting by Date created ascending (oldest first), the same groups apply but appear in reverse order — "Older" at top, "Today" at bottom.

## Persistence

Sort preference persists across page reloads via `localStorage`, matching the existing theme persistence pattern:

- Key: `"th-sort"` (follows the `"th-theme"` naming convention)
- Value: JSON string, e.g. `{"field":"title","direction":"asc"}`
- Read on app startup in an `initSort()` function, similar to `initTheme()`
- Written on every sort change via `setSort()`
- Graceful fallback to default (`{field: "createdAt", direction: "desc"}`) if localStorage is unavailable or value is corrupt

Not using IndexedDB — this is a simple key-value preference, same as theme. localStorage is synchronous and simpler.

## Edge Cases

### Non-Thought.Haus format files

Files that don't follow the `YYYYMMDDTHHMMSS--slug.md` naming convention have `isTimestampFormat: false`. Their `createdAt` falls back to `file.lastModified` (set in `file-ops.ts`). This means:

- **Sort by date created:** Non-Thought.Haus files sort by their file modification timestamp. This is imperfect but the best available approximation. No special treatment needed.
- **Sort by title:** Non-Thought.Haus files use the raw filename (minus `.md`) as their title. They sort alphabetically like everything else.
- **Sort by last modified:** Works identically — `lastModified` is always available from the file system.

No special indicators or separate grouping for non-Thought.Haus files. They're first-class citizens in every sort mode.

### Notes with identical titles

Titles are not unique. When sorting by title, notes with the same title are sub-sorted by `createdAt` descending (newest first) as a tiebreaker. This provides stable, deterministic ordering.

### Notes created at the same second

Extremely unlikely with the `YYYYMMDDTHHMMSS` precision, but if it happens, sub-sort by title alphabetically as tiebreaker. The sort must be stable and deterministic.

### Empty or missing values

- A note with an empty title (`""`) sorts to the top in A→Z mode, bottom in Z→A. This is fine — it's the user's data.
- `lastModified` is always present (comes from the file system). No missing-value case.
- `createdAt` always has a value (either parsed from filename or fallen back to `lastModified`). No missing-value case.

## Non-Goals

- **Multi-column sort** (e.g., sort by tag then by date within each tag) — too complex for a P2 feature
- **Custom sort orders** (drag-and-drop reordering) — out of scope
- **Sort within search results** — search results use relevance ranking only
- **Per-tag sort preferences** — one global sort applies everywhere
- **Sort by file size** — not useful for notes
- **Grouping by last-modified date** — adds complexity for minimal value; flat list when not sorting by creation date

## Acceptance Criteria

1. A sort control is visible in the sidebar (between tag pills and the note list) that lets users choose between Date Created, Title, and Last Modified
2. Default sort is Date Created, newest first — identical to current behavior
3. Users can toggle sort direction (asc/desc) for the active field
4. Changing the sort field resets direction to that field's default
5. Date groups ("Today", "Yesterday", etc.) appear when sorting by Date Created; hidden for other sort fields
6. Sort applies within tag-filtered results
7. Sort controls are hidden/disabled when search is active; search results maintain relevance ranking
8. Sort preference persists across page reloads via localStorage (`"th-sort"`)
9. Non-Thought.Haus format files sort correctly in all modes without errors
10. All existing tests continue to pass
