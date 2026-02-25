# Backlinks in Thought.Haus — Product Requirements Document

## Problem Statement

Thought.Haus already supports forward-linking between notes with `[[YYYYMMDDTHHMMSS]]` syntax. A user can type `[[` to link to another note, and clicking that link navigates to the target. But the relationship is one-directional: if Note A links to Note B, Note B has no awareness of this connection.

This means a note can be referenced from five other places and the author would never know. The connections between ideas exist in the user's head but are invisible in the tool. Backlinks surface these inbound connections without requiring users to manually maintain them.

## Landscape Analysis

### What works across apps

Every major note-linking tool (Obsidian, Roam, Logseq, Notion, Bear) implements backlinks differently, but the patterns that survive real usage are consistent:

1. **A simple list of linking notes is sufficient.** Obsidian's backlinks panel, Roam's linked references, and Logseq's references all boil down to the same thing: a list of notes that link to the current note. Users glance at it, occasionally click through, and move on. The list itself is the feature.

2. **Context matters, but not much.** Obsidian shows the paragraph surrounding each backlink. Roam shows the block. In practice, most users just read the note title, recognize the connection, and click if they want to revisit it. A line or two of surrounding context helps with disambiguation when multiple notes share similar titles, but walls of preview text go unread.

3. **Always-visible beats hidden.** Obsidian offers both a sidebar panel and an in-note section. Users overwhelmingly prefer the in-note section because it's discoverable without configuration. Notion's backlinks (a collapsed "N backlinks" line at the top of a page) succeed precisely because they're present without being loud.

4. **Graph views are toys.** Every PKM app ships a graph view. Users play with it for ten minutes, screenshot it for Twitter, and never open it again. It provides almost zero utility for actual note-taking work. The network is too dense to read, the layout is arbitrary, and there's no action you can take from it that you can't take faster from a backlinks list.

5. **"Unlinked mentions" are noise.** Obsidian and Roam show text matches that *could* be links but aren't. In practice, this generates false positives and users either disable it or learn to ignore it. It's a feature for completionists, not writers.

### What the minimalist apps teach us

Bear added backlinks years after launch. Their implementation is instructive: a small, collapsible section at the bottom of a note showing linked note titles. No context snippets. No graph. No unlinked mentions. It works because it's quiet. Apple Notes still has no backlinks at all. iA Writer supports wiki-links for navigation but has no backlink surfacing — and users don't complain much, because the core value is writing, not knowledge management.

The lesson: backlinks are most valuable when they're ambient information, not a primary interface. They should answer the question "what links here?" without demanding attention.

## Design Principles for Thought.Haus

1. **No new panels, sidebars, or views.** The three-column layout (NavSidebar | NotesList | Editor) is the product. Backlinks live inside the editor view, not beside it.

2. **Present when relevant, invisible when not.** If a note has zero backlinks, show nothing. If it has backlinks, show them quietly below the editor content.

3. **Titles are enough.** The backlink list shows note titles. Users can click to navigate. No paragraph-level context, no block embeds, no search result highlighting.

4. **Computed, not stored.** Backlinks are derived from the existing `[[noteId]]` link syntax already in note content. No new file format, no sidecar files, no database. The index lives in memory and is rebuilt from what already exists.

5. **No graph view.** Not now, not on the roadmap. A backlinks list provides the same information in a more actionable format.

6. **No unlinked mentions.** Text matching without explicit links is a search problem, and Thought.Haus already has search. Conflating the two creates noise.

## Feature Specification

### Backlink Index

A reactive, in-memory index that maps each note ID to the set of note IDs that link to it.

**Data structure:**

```
Map<string, Set<string>>   // targetNoteId → Set<sourceNoteId>
```

**When it's built:**
- During the initial directory scan (alongside the search index build), the body of each note is already read. Parse outgoing `[[noteId]]` references from each note body using the existing `parseNoteLinks()` function and populate the backlink map.

**When it's updated:**
- On note save: re-parse the saved note's body, diff against its previous outgoing links, and update the backlink map entries for any added or removed targets.
- On note delete: remove all outgoing link entries from the deleted note.
- On file watcher update: when external changes are detected and a note's content changes, re-parse and update.

**Reactive surface:**
- Export a function `getBacklinks(noteId: string): Note[]` that returns the notes linking to the given note, sorted by creation date (newest first).
- Wrap it so the editor view can reactively display backlinks for the currently selected note. A Preact Signal (`backlinkIndex`) enables this — when the map updates, any computed that reads from it will re-render.

**Location:** New module at `packages/app/src/notes/backlink-index.ts`. This keeps backlink logic out of the note store (which manages CRUD) and out of the search engine (which manages full-text search). Backlinks are a relationship index, which is a distinct concern.

### Editor UI — Backlinks Section

A collapsible section rendered below the TipTap editor content and above the status bar in `EditorView`.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  ★  Meeting Notes                           │
│  [ work ] [ meetings ]  + tag  March 22     │
│─────────────────────────────────────────────│
│                                             │
│  (TipTap editor content)                    │
│                                             │
│  ...                                        │
│                                             │
│─────────────────────────────────────────────│
│  ↗ 3 backlinks                    ▾         │  ← new: backlinks header
│                                             │
│    Project Alpha Overview                   │  ← clickable note title
│    Weekly Review 2024-03-22                 │
│    Research: Distributed Systems            │
│                                             │
│─────────────────────────────────────────────│
│  423 words                        Saved     │
└─────────────────────────────────────────────┘
```

**Behavior:**

- **Visibility:** Only rendered when the current note has at least one backlink. Zero backlinks = no section, no empty state, no placeholder.
- **Header:** Shows the count (e.g., "3 backlinks") with a small toggle chevron. Clicking the header collapses/expands the list.
- **Default state:** Expanded. The collapsed/expanded preference is persisted per-session (not per-note) using a signal, similar to how `sidebarCollapsed` works. Most users will leave it expanded once they discover it.
- **List items:** Each backlink is a single line showing the note title. Clicking navigates to that note (sets `selectedNoteId`). Hover shows the same subtle highlight used elsewhere in the app.
- **Scroll behavior:** The backlinks section is inside the scrollable editor body area, below the editor content. It scrolls naturally with the document. It does not take away from the editor's vertical space for short documents — the editor content has a `min-height` and the backlinks appear after it.
- **Separator:** A subtle top border separates the backlinks section from the editor content, using the same `--color-border` used in the status bar.

**Styling:**

- Matches the existing metadata styling conventions: `0.8125rem` font size, `var(--color-text-secondary)` color, same horizontal padding as the editor body (`3rem` desktop, `1rem` mobile).
- Note titles in the list use `var(--color-accent)` on hover, matching the note-link styling in the editor.
- The toggle chevron is a small Lucide icon (`ChevronDown` / `ChevronRight`), 14px, secondary color.
- No background color, no cards, no borders around individual items. Just a clean list.

### Integration Points

**`packages/app/src/notes/backlink-index.ts` (new file)**
- `backlinkIndex` signal: `Signal<Map<string, Set<string>>>`
- `buildBacklinkIndex(notes, readBody)`: called during scan, builds the full index
- `updateNoteLinks(noteId, body)`: called on save, updates outgoing links for one note
- `removeNoteLinks(noteId)`: called on delete
- `getBacklinks(noteId)`: returns `Note[]` of notes linking to the given ID

**`packages/app/src/storage/scan.ts`**
- After scanning notes and building the search index, call `buildBacklinkIndex()` using the note bodies already read during scan. No additional file reads needed.

**`packages/app/src/ui/editor-view.tsx`**
- Import `getBacklinks` and render the backlinks section below the editor body div.
- New component `BacklinksSection` (either inline or a small separate component in the same file or a new `backlinks-section.tsx`).

**`packages/app/src/notes/note-actions.ts`**
- After saving a note: call `updateNoteLinks(noteId, body)`.
- After deleting a note: call `removeNoteLinks(noteId)`.

**`packages/app/src/storage/file-watcher.ts`**
- When an external change updates a note's content: call `updateNoteLinks()` with the new body.

### What This Feature Does NOT Include

- **Graph view:** No visual network diagram. Not planned.
- **Unlinked mentions:** No fuzzy text matching for potential links. Search already handles this.
- **Backlink count in NotesList:** The sidebar note items do not show a backlink count badge. This would add visual noise to every note item for marginal benefit.
- **Outgoing links section:** No "links from this note" panel. The user can see outgoing links by reading their own note. Showing them again in a list is redundant.
- **Backlink persistence to disk:** The index is computed at load time from existing note content. No `.thoughthouse/backlinks.json` or similar file. This keeps the system stateless and avoids sync issues.
- **Two-hop connections:** No "notes that link to notes that link to this note." This is complexity that serves academics writing dissertations, not day-to-day note-takers.

## Technical Notes

### Performance

The backlink index is a lightweight `Map<string, Set<string>>`. For a typical vault of 1,000 notes with an average of 3 links per note, this is 3,000 entries — trivial in memory and sub-millisecond to query. Parsing `[[noteId]]` uses the existing `NOTE_LINK_RE` regex which is already battle-tested. The full rebuild during scan adds negligible time since the note bodies are already being read for the search index.

Incremental updates on save are O(L) where L is the number of outgoing links in the saved note (typically < 10). There is no expensive re-indexing.

### Consistency with existing patterns

- **Signals for reactivity:** Follows the same pattern as `notesMap`, `tagCounts`, `favoriteIds`. A signal holds the map; consumers react to changes.
- **CSS Modules:** The backlinks section uses a CSS module (either the existing `editor-view.module.css` or a new `backlinks-section.module.css`).
- **No new dependencies:** Uses existing `parseNoteLinks()`, `getNote()`, and `notesMap`. No new libraries.
- **Mobile support:** The backlinks section renders identically on mobile, just with the narrower padding. No special mobile treatment needed since it's part of the scrollable editor body.

### Edge cases

- **Circular links:** Note A links to Note B and vice versa. Both show the other in their backlinks. This is correct and expected behavior.
- **Self-links:** A note linking to itself (`[[ownId]]`) should not appear in its own backlinks list.
- **Broken links:** If Note A contains `[[nonexistent]]`, this does not generate a backlink entry because the target note doesn't exist. If the target is later created, it will pick up the backlink on the next scan or when Note A is re-saved.
- **Non-timestamp notes:** Plain `.md` files without timestamp IDs are supported as both source and target of links, consistent with existing note-link behavior.
- **Deleted source notes:** When a note is deleted, `removeNoteLinks()` cleans up its entries from the backlink index. The target note's backlinks section updates reactively.

## Success Criteria

- Opening a note that is linked from other notes shows a backlinks section with correct, clickable titles.
- Opening a note with no inbound links shows no backlinks section.
- Creating a new link to a note and saving causes the target note's backlinks to update.
- Deleting a note removes it from all backlink lists.
- The backlinks section is visually quiet and consistent with the existing Thought.Haus aesthetic.
- No new panels, sidebars, modals, or settings are introduced.
- Performance is imperceptible — no visible delay on scan or save.
