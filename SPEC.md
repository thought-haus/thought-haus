# Noti: High-Level Specification

## 1. Product Overview

Noti is a **local-first, browser-based note-taking app** inspired by the
original Evernote's focus on simple capture, organization, and retrieval. It
runs entirely client-side — no server, no accounts, no sync service. Notes are
stored as plain Markdown files in a user-selected local folder using the browser
File System API, with filenames encoding an immutable timestamp ID and
human-readable title.

### Vision

The file system IS the database. If Noti disappears, the user still has
perfectly organized, human-readable Markdown files. Noti is a lens on a folder,
not a database that exports files.

### What Makes Noti Different

| Capability          | Noti             | Obsidian      | Bear        | Notion      |
| ------------------- | ---------------- | ------------- | ----------- | ----------- |
| Runs in browser     | Yes              | No (Electron) | No (native) | Yes (cloud) |
| Zero install        | Yes              | No            | No          | N/A         |
| Local files you own | Yes              | Yes           | No          | No          |
| No account required | Yes              | Yes           | Yes         | No          |
| Works offline       | Yes (after load) | Yes           | Yes         | No          |

---

## 2. Target Platform

**Chromium-only** (Chrome, Edge, Brave, Arc). The File System API's
`showDirectoryPicker()` is not supported in Firefox or Safari. Noti must display
a clear browser compatibility notice for unsupported browsers. Requires HTTPS or
localhost.

---

## 3. File Naming Scheme

Filenames encode an immutable creation timestamp and a slugified title:

```
IDENTIFIER--TITLE.EXTENSION
```

| Component  | Required | Separator         | Format                | Example             |
| ---------- | -------- | ----------------- | --------------------- | ------------------- |
| Identifier | Yes      | (starts filename) | `YYYYMMDDTHHMMSS`    | `20240322T131856`   |
| Title      | No       | `--` prefix       | Hyphen-separated slug | `--some-note-title` |
| Extension  | Yes      | `.`               | File type             | `.md`               |

**Valid filenames:**

- `20240322T131856--meeting-notes.md` (most common)
- `20240322T131856.md` (untitled note)

**Key rules:**

- The ID (creation timestamp) is **immutable** — it never changes, even on
  rename
- Title is slugified: lowercase, spaces become hyphens, strip special characters
- Changing a title means **renaming the file on disk**
- Tags are stored in **YAML front matter** inside the file, not in the filename
- The ID serves as a stable identifier for **note-to-note linking**

**Implications:**

- Lexicographic sort = chronological sort (IDs are timestamps)
- Users see meaningful filenames when browsing in Finder/Explorer
- Title changes require a file rename; tag changes do not
- Note linking by ID is stable — links survive title renames

### Front Matter

Every note includes minimal YAML front matter as the metadata source of truth
for tags:

```yaml
---
title: Meeting Notes
date: 2024-03-22T13:18:56
tags:
  - project
  - work
---
```

- `title` — human-readable title (authoritative; also reflected in filename slug)
- `date` — creation timestamp (matches filename ID)
- `tags` — list of tags for this note (the **sole source of truth** for tags)

Front matter is written on note creation and updated when the user edits tags
or title via the UI. Body content follows after the closing `---`.

### Non-Noti Files

`.md` files without the expected naming scheme are shown in the note list using
their raw filename as the title, with no tags. They are fully editable. Non-`.md`
files are ignored.

---

## 4. MVP Scope

### P0 — Launch Blockers

1. **Folder selection & persistence** — `showDirectoryPicker()` with handle
   stored in IndexedDB for session persistence. Re-permission flow on return
   visits via `handle.requestPermission()`.

2. **Note listing** — Scan directory for `.md` files, parse filenames for ID and
   title, read front matter for tags. Display in sidebar sorted by creation date
   (newest first). Show parsed title and tag pills. Handle non-Noti files
   gracefully (see Section 3).

3. **Note creation** — `Cmd/Ctrl+N` or `+` button. Immediate editor focus — no
   modal dialogs. Auto-generate filename from timestamp + title. File written to
   disk on first save with front matter.

4. **Markdown editing with auto-save** — TipTap editor with Markdown
   syntax highlighting. Debounced auto-save (1–2s after last keystroke). Save on
   blur for minimal data loss. Best-effort save on `beforeunload`. Visual save
   status indicator.

5. **Note deletion** — Confirmation dialog, then `removeEntry()` on the
   directory handle. Update UI and search index immediately.

6. **Tag management & filtering** — Tags stored in front matter. Editable via
   UI tag pills in the editor metadata bar. Tag list in sidebar with counts,
   click to filter note list.

7. **Full-text search** — MiniSearch indexes title, tags, and body content.
   Single search bar in sidebar (`Cmd/Ctrl+K` to focus) provides instant
   as-you-type results across all fields. Index persisted in IndexedDB for fast
   reload.

8. **Service worker for offline** — Minimal service worker caching app assets
   (HTML, JS, CSS) so the app loads fully offline after the first visit.

### P1 — Ship Soon After

9. **Note title renaming** — Edit title in UI, which renames the file on disk
    (preserving the original ID). Handle via create-new + write + delete-old
    pattern.

10. **External change detection** — Poll directory every 5–10 seconds + on
    window focus. Diff file list against cached state. Detect additions,
    deletions, modifications. Rebuild affected search index entries.
    Progressively enhance with `FileSystemObserver` when available.

11. **Keyboard shortcuts** — `Cmd/Ctrl+N` new note, `Cmd/Ctrl+K` search,
    `Cmd/Ctrl+\` toggle sidebar.

12. **Note linking** — Link to other notes by ID using `[[20240322T131856]]`
    syntax. Rendered as clickable links showing the target note's title.

### P2 — Nice to Have

13. Hybrid Markdown rendering (hide syntax when cursor is elsewhere)
14. Note templates
15. Dark mode / theme support
16. Sort options (date, title, last modified)
17. Pin/favorite notes
18. Full PWA installability (manifest, install prompt)

### Non-Goals for v1

- No sync / cloud storage
- No collaboration / sharing
- No AI features
- No mobile support
- No plugins / extensions
- No nested folders (flat directory only)
- No WYSIWYG rich text (Markdown-first)
- No accounts or authentication
- No Firefox / Safari support
- No import from other apps

---

## 5. User Stories

**US-1: First-time Setup** — As a new user, I want to select a folder on my
computer to store my notes, so that I can start using Noti without creating an
account or installing anything. _First note created in under 30 seconds._

**US-2: Create a Note** — As a user, I want to quickly create a new note, so
that I can capture my thoughts immediately. _One action from intent to typing.
No dialogs._

**US-3: Browse and Find Notes** — As a user, I want to see all my notes and
search by title, tag, or content, so that I can quickly find what I'm looking
for. _Any note findable in under 3 seconds._

**US-4: Edit and Auto-save** — As a user, I want to edit a note and have changes
saved automatically, so that I never lose my work. _Visual save indicator, no
explicit save needed._

**US-5: Organize with Tags** — As a user, I want to add/remove tags and filter
by them, so that I can organize without managing folders. _Tags editable via UI,
stored in front matter._

**US-6: Delete a Note** — As a user, I want to delete a note I no longer need.
_Confirmation dialog, file removed from disk._

**US-7: Return to My Notes** — As a returning user, I want to open Noti and see
my notes with a single click, not re-select my folder. _IndexedDB handle
persistence with one-click re-permission._

**US-8: External Changes** — As a user who edits files outside the browser, I
want Noti to detect external changes and stay in sync. _Polling detects
new/deleted/modified files._

---

## 6. UX Design

### Design Principles

1. **Capture is king** — Minimum friction from thought to written note
2. **Files are the truth** — The folder IS the notebook, Noti is a lens
3. **Tags over folders** — More flexible, tags live in front matter
4. **Search over browse** — Primary navigation via full-text search, secondary
   via tag filtering
5. **Markdown-native** — Standard Markdown syntax highlighting, clean files on
   disk
6. **Transparent filenames** — Pretty titles in UI, timestamped filenames
   accessible for power users
7. **Resist feature creep** — Learn from Evernote's decline. Depth over breadth.
8. **No account required** — Local-first simplicity is a feature

### Layout: Collapsible Two-Pane

```
+--------------------+------------------------------------------+
|     SIDEBAR        |               EDITOR                     |
|                    |                                          |
|  [Search bar]      |  Note Title (editable)                   |
|                    |  #tag1 #tag2          March 22, 2024     |
|  ALL NOTES (42)    |  ─────────────────────────────────────   |
|  ───────────────── |                                          |
|  TAGS              |  Note body content here...               |
|   #work (12)       |                                          |
|   #personal (8)    |  Markdown with syntax highlighting.      |
|   #recipes (5)     |                                          |
|  ───────────────── |                                          |
|  NOTES             |                                          |
|   Today            |                                          |
|    Meeting notes   |                                          |
|    Project plan    |                                          |
|   Yesterday        |                                          |
|    Recipe idea     |                                          |
+--------------------+------------------------------------------+
                                          Word count · Saved ✓
```

**Why two-pane, not three-pane:**

- Maximizes editor space — writing is the core activity
- Reduces cognitive overhead — navigate or write, one at a time
- Sidebar serves double duty (tags + note list)
- Collapses naturally to single pane on narrow viewports

**Sidebar structure (top to bottom):**

1. Search bar — always visible, `Cmd/Ctrl+K` focuses it, searches across title,
   tags, and content via MiniSearch
2. All Notes — total count, click to show all
3. Tags section — collapsible, tag list with counts, click to filter
4. Note list — filtered notes, showing title + preview + date + tag pills

**Editor area structure:**

1. Title — large, editable, changes sync to filename on save
2. Metadata bar — editable tag pills + creation date, subtle
3. Editor body — TipTap with Markdown editing
4. Status bar — word count, save status, minimal

**Sidebar:** Default 280px, resizable, collapsible via `Cmd/Ctrl+\`. On narrow
viewports (<768px), overlays as slide-out panel.

### Key Interaction Flows

**Onboarding:**

1. Clean landing page with explanation: "Your notes never leave your device"
2. Single CTA: "Open a Folder" → native `showDirectoryPicker()`
3. If folder has existing `.md` files → scan and show them
4. If folder is empty → create a welcome note, open it
5. Store handle in IndexedDB for next visit

**Returning user:**

1. Check IndexedDB for saved handle
2. Call `queryPermission()` — if granted, go straight to notes
3. If permission expired, show "Re-open [folder name]" button (one click)
4. If denied, fall back to folder picker

**Creating a note:**

1. `Cmd/Ctrl+N` or `+` button
2. New untitled note opens immediately in editor
3. Cursor in title field (or body if preferred)
4. Filename generated on first save: `YYYYMMDDTHHMMSS--slugified-title.md`
5. Front matter written with title, date, and empty tags
6. No dialogs, no "choose notebook" step

**Editing:**

- Standard Markdown editing via TipTap
- Minimal formatting toolbar for non-Markdown users
- No split pane, no mode switching

---

## 7. Technical Architecture

### Tech Stack

| Layer        | Choice            | Size (gzip) | Rationale                                                             |
| ------------ | ----------------- | ----------- | --------------------------------------------------------------------- |
| Build        | Vite + TypeScript | —           | Given requirement. Fast HMR, ESM-native.                              |
| UI Framework | Preact + Signals  | ~5 KB       | React-compatible API, fine-grained reactivity, tiny footprint         |
| CSS          | CSS Modules       | 0 KB        | Scoped styles via Vite, zero runtime cost                             |
| Editor       | TipTap            | ~50 KB      | ProseMirror-based, extensible, rich-text Markdown editing             |
| Search       | MiniSearch        | ~8 KB       | Full-text indexing, fuzzy search, prefix search, field boosting       |
| **Total JS** |                   | **~100 KB** | Well under 150 KB budget                                              |

**Why Preact:** 3 KB vs React's 40+ KB. React-compat layer available. Signals
provide fine-grained reactivity without Redux/Zustand boilerplate.

**Why TipTap:** ProseMirror-based, rich extension ecosystem, structured document
model, TypeScript-native, widely adopted. Extensible for future features.

**Why MiniSearch:** 8 KB gzipped, zero dependencies. True full-text search with
fuzzy matching, prefix search, and field-weighted boosting. Supports incremental
add/remove/update without full index rebuilds. JSON serialization for IndexedDB
persistence. Battle-tested in production note-taking apps.

**Why not ProseMirror/TipTap:** Better for WYSIWYG, but Noti is Markdown-first.
**Why not Monaco:** 2–4 MB, overkill. **Why not Fuse.js:** Fuzzy matching only,
not true full-text search. **Why not FlexSearch:** No match scoring, more complex
API.

### Module Architecture

```
src/
  fs/                     # File System Layer
    directory.ts          # Directory picker, handle management, IndexedDB persistence
    file-ops.ts           # Read, write, create, delete files
    watcher.ts            # FileSystemObserver + polling fallback
    permissions.ts        # Permission checking and re-requesting

  notes/                  # Note Model Layer
    note.ts               # Note type definition
    filename.ts           # Filename parsing (ID + title) and generation
    frontmatter.ts        # YAML front matter parsing/serialization (tags, title, date)
    note-store.ts         # In-memory note collection (Preact Signals)

  search/                 # Search Layer
    search-engine.ts      # MiniSearch setup, field config, query execution
    search-index.ts       # Index lifecycle: build, update, persist to IndexedDB

  editor/                 # Editor Layer
    editor.ts             # TipTap editor setup and configuration
    keybindings.ts        # Custom keybindings

  ui/                     # UI Layer (Preact)
    app.tsx               # Root component
    sidebar.tsx           # Note list, search, tag filter
    editor-view.tsx       # Editor wrapper
    onboarding.tsx        # First-run directory picker
    browser-check.tsx     # Compatibility notice

  lib/                    # Shared Utilities
    date.ts               # Timestamp formatting
    slug.ts               # Slugification
    debounce.ts           # Debounce/throttle

  sw.ts                   # Service worker for offline asset caching
```

### Data Flow

```
[User picks directory]
       │
       ▼
[FS Layer] ── scans directory, returns FileSystemHandles
       │
       ▼
[Note Model] ── parses filenames for ID + title
       │         reads front matter for tags
       │         maintains Map<id, Note> via Signals
       ▼
[Search Layer] ── MiniSearch indexes title, tags, body content
       │          persisted in IndexedDB for fast reload
       ▼
[UI Layer] ── renders note list, search results, tags from store
       │
       ▼
[Editor Layer] ── loads note content into TipTap, emits changes
       │
       ▼
[FS Layer] ── debounced write back to file (1–2s)
       │
       ▼
[Watcher] ── polling (5–10s) or FileSystemObserver
       │         detects external changes, triggers rescan
       ▼
[Note Model] ── reconciles, updates store + search index → UI reacts
```

### Key Data Types

```typescript
interface Note {
  id: string; // YYYYMMDDTHHMMSS (immutable, from filename)
  title: string; // Human-readable, parsed from filename
  tags: string[]; // From front matter (source of truth for tags)
  filename: string; // Full filename on disk
  fileHandle: FileSystemFileHandle;
  lastModified: number; // For conflict detection
  size: number;
}
```

### File System Strategy

- **Directory access:** `showDirectoryPicker()` → handle persisted in IndexedDB
- **Permission re-grant:** `handle.requestPermission({ mode: 'readwrite' })` on
  return visit (one-click prompt)
- **File watching:** Polling baseline (scan on timer + window focus),
  progressive enhancement with `FileSystemObserver` via feature detection
- **Rename:** Only triggered on title change. Create new file → write content →
  delete old file.
- **Conflict detection:** Check `file.lastModified` before writes. If changed
  externally, warn user and offer to reload or overwrite.
- **Flat directory only** — no subdirectory traversal

### Search Strategy

MiniSearch is the primary search and filtering engine for the app:

```
User types query
       │
       ▼
[MiniSearch] ── searches across title, tags, and body content
       │         field boosting: title (2x), tags (1.5x), body (1x)
       │         fuzzy matching + prefix search
       ▼
[Ranked results] ── returned to UI, displayed in sidebar
```

- **Index fields:** `title`, `tags` (joined as string), `body`
- **Stored fields:** `title`, `id` (for fast result rendering without lookup)
- **Index built on startup:** Load from IndexedDB if available, otherwise build
  from files. For 1,000 notes this takes < 1 second.
- **Incremental updates:** `add()` on note creation, `discard()` + `add()` on
  edit, `discard()` on deletion. No full rebuilds needed.
- **Persistence:** `JSON.stringify(miniSearch)` → IndexedDB. Debounced save
  after index changes. `MiniSearch.loadJSON()` on startup.
- **Tag filtering:** Implemented via MiniSearch field search
  (`{ fields: ['tags'] }`) or simple in-memory filter on the note store.

---

## 8. Key Risks and Mitigations

| Risk                                 | Severity   | Mitigation                                                                                                             |
| ------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Chromium-only**                    | HIGH       | Clear browser compatibility notice. Target Chrome/Edge/Brave/Arc.                                                      |
| **Permission re-grant UX**           | MEDIUM     | IndexedDB handle persistence. One-click re-permission. Explain in onboarding.                                          |
| **Large notebook perf (10k+ files)** | MEDIUM     | Cache file list in IndexedDB. Load from cache first, reconcile in background. Virtualize note list. Lazy-load content. |
| **File rename on title change**      | LOW        | Renames only happen on title change (not tags). Create-new + write + delete-old pattern.                               |
| **FileSystemObserver not stable**    | LOW        | Polling fallback is the primary strategy. Observer is progressive enhancement.                                         |
| **Concurrent access conflicts**      | LOW-MEDIUM | `lastModified` check before writes. Warn and offer reload or overwrite.                                                |
| **Search index staleness**           | LOW        | Incremental MiniSearch updates on every note change. Periodic full rebuild as safety net.                              |

---

## 9. Success Criteria

### Functional

- All P0 features working
- Core loop (create → edit → find → delete) takes under 3 actions each
- Filenames correctly generated and parsed
- Tags correctly stored in and read from front matter
- Full-text search returns relevant results across title, tags, and content

### Performance

- App loads in under 2 seconds
- 1,000-note directory loads list in under 3 seconds
- Note opens for editing in under 500ms
- Auto-save completes in under 200ms
- Search results appear as-you-type (< 50ms per query)
- No visible jank during normal use

### Reliability

- Zero data loss under normal usage (debounced auto-save + save on blur)
- Graceful handling of permission denial, external conflicts, browser restart
- Works correctly after session restore (re-permission flow)
- App loads and functions fully offline after first visit (service worker)

### User Experience

- First note created within 30 seconds of landing
- App feels fast — no loading spinners for common operations
- Keyboard-driven workflow for power users
- Clean, minimal interface focused on writing

### Technical

- Works in Chrome, Edge, Brave, Arc (latest versions)
- Fully offline after initial page load
- Total JS bundle under 150 KB gzipped

---

## 10. Open Questions for Detailed Planning

1. **Non-Noti `.md` files with front matter** — If an externally-created `.md`
   file has its own front matter, do we parse it for tags? Or only recognize
   Noti-generated front matter?
2. **Welcome note** — What content? Should it be a tutorial or just a greeting?
3. **Search index cold start** — On first visit with a large existing folder,
   building the MiniSearch index requires reading every file's content. Show a
   progress indicator? Build incrementally during idle time?
4. **Note linking resolution** — When rendering `[[ID]]` links, how do we handle
   broken links (target note deleted)? Show as dead link with ID?
