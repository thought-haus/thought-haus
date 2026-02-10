# Noti: High-Level Specification

## 1. Product Overview

Noti is a **local-first, browser-based note-taking app** inspired by the
original Evernote's focus on simple capture, organization, and retrieval. It
runs entirely client-side — no server, no accounts, no sync service. Notes are
stored as plain Markdown files in a user-selected local folder using the browser
File System API, with filenames following the **denote naming scheme** to encode
metadata (ID, title, tags) directly in the filename.

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
| Denote-compatible   | Yes              | No            | No          | No          |
| Works offline       | Yes (after load) | Yes           | Yes         | No          |

---

## 2. Target Platform

**Chromium-only** (Chrome, Edge, Brave, Arc). The File System API's
`showDirectoryPicker()` is not supported in Firefox or Safari. Noti must display
a clear browser compatibility notice for unsupported browsers. Requires HTTPS or
localhost.

---

## 3. The Denote Naming Scheme

Files follow the [denote](https://protesilaos.com/emacs/denote) naming
convention:

```
IDENTIFIER--TITLE__KEYWORDS.EXTENSION
```

| Component  | Required | Separator                | Format                                 | Example             |
| ---------- | -------- | ------------------------ | -------------------------------------- | ------------------- |
| Identifier | Yes      | (starts filename)        | `YYYYMMDDTHHMMSS`                      | `20240322T131856`   |
| Signature  | No       | `==` prefix              | Alphanumeric slug                      | `==1a2`             |
| Title      | No       | `--` prefix              | Hyphen-separated slug                  | `--some-note-title` |
| Keywords   | No       | `__` prefix, `_` between | Lowercase slugs, alphabetically sorted | `__project_todo`    |
| Extension  | Yes      | `.`                      | File type                              | `.md`               |

**Valid permutations:**

- `20240322T131856--some-title__tag1_tag2.md` (most common)
- `20240322T131856--some-title.md` (no tags)
- `20240322T131856__tag1_tag2.md` (no title)
- `20240322T131856.md` (bare minimum)

**Key rules:**

- The ID (creation timestamp) is **immutable** — it never changes, even on
  rename
- Title is slugified: lowercase, spaces become hyphens, strip special characters
- Keywords are alphabetically sorted, separated by single underscores
- Changing a title or tags means **renaming the file on disk**
- No metadata database needed — the filename carries ID, title, and tags

**Implications:**

- Lexicographic sort = chronological sort (IDs are timestamps)
- Filename-based search covers title + tags + date without reading file contents
- Files are interoperable with Emacs denote
- Users see meaningful filenames when browsing in Finder/Explorer

---

## 4. MVP Scope

### P0 — Launch Blockers

1. **Folder selection & persistence** — `showDirectoryPicker()` with handle
   stored in IndexedDB for session persistence. Re-permission flow on return
   visits via `handle.requestPermission()`.

2. **Note listing** — Scan directory for `.md` files, parse denote filenames,
   display in sidebar sorted by creation date (newest first). Show parsed title
   and tag pills. Handle non-denote files gracefully.

3. **Note creation** — `Cmd/Ctrl+N` or `+` button. Immediate editor focus — no
   modal dialogs. Auto-generate denote filename from timestamp + title + tags.
   File written to disk on first save.

4. **Markdown editing with auto-save** — CodeMirror 6 editor with Markdown
   support. Hybrid rendering (hide syntax when cursor is elsewhere). Debounced
   auto-save (1–2s after last keystroke). Save on blur/beforeunload for zero
   data loss. Visual save status indicator.

5. **Note deletion** — Confirmation dialog, then `removeEntry()` on the
   directory handle. Update UI immediately.

6. **Tag display & filtering** — Parse tags from filenames, show tag list in
   sidebar with counts, click to filter note list.

### P1 — Ship Soon After

7. **Note renaming** — Edit title/tags in UI, which renames the file on disk
   (preserving the original ID). Handle via create-new + write + delete-old
   pattern.

8. **Search / filter by title** — Text input filters note list by title
   substring. Instant as-you-type. Command palette style (`Cmd/Ctrl+K`).

9. **External change detection** — Poll directory every 5–10 seconds + on window
   focus. Diff file list against cached state. Detect additions, deletions,
   modifications. Progressively enhance with `FileSystemObserver` when
   available.

10. **Keyboard shortcuts** — `Cmd/Ctrl+N` new note, `Cmd/Ctrl+K` search,
    `Cmd/Ctrl+\` toggle sidebar.

11. **Front matter** — Minimal YAML front matter (`title`, `date`, `tags`,
    `identifier`) for denote interop.

### P2 — Nice to Have

12. Full-text content search (MiniSearch)
13. Signature support (`==` component)
14. Note templates
15. Dark mode / theme support
16. Sort options (date, title, last modified)
17. Pin/favorite notes
18. PWA installability

### Non-Goals for v1

- No sync / cloud storage
- No collaboration / sharing
- No AI features
- No mobile support
- No plugins / extensions
- No nested folders (flat directory, matching denote defaults)
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
filter by tag or title, so that I can quickly find what I'm looking for. _Any
note findable in under 3 seconds._

**US-4: Edit and Auto-save** — As a user, I want to edit a note and have changes
saved automatically, so that I never lose my work. _Visual save indicator, no
explicit save needed._

**US-5: Organize with Tags** — As a user, I want to add/remove tags and filter
by them, so that I can organize without managing folders. _Tags sync
bidirectionally between UI and filename._

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
3. **Tags over folders** — More flexible, matches denote's model (Bear-style)
4. **Search over browse** — Primary navigation via search, secondary via tag
   filtering
5. **Hybrid Markdown** — Rich rendering inline, clean Markdown on disk, no mode
   switching
6. **Transparent filenames** — Pretty titles in UI, denote filenames accessible
   for power users
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
|   #personal (8)    |  Markdown with inline rendering.         |
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

1. Search bar — always visible, `Cmd/Ctrl+K` focuses it
2. All Notes — total count, click to show all
3. Tags section — collapsible, tag hierarchy with counts, click to filter
4. Note list — filtered notes, showing title + preview + date + tag pills

**Editor area structure:**

1. Title — large, editable, changes sync to filename
2. Metadata bar — tag pills + creation date, subtle
3. Editor body — CodeMirror 6 with hybrid Markdown rendering
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
4. Filename generated on first save: timestamp + slugified title + tags
5. No dialogs, no "choose notebook" step

**Editing:**

- Hybrid Markdown: `**bold**` renders as **bold** inline, syntax revealed on
  cursor
- Minimal formatting toolbar for non-Markdown users
- No split pane, no mode switching — the editor IS the preview

---

## 7. Technical Architecture

### Tech Stack

| Layer        | Choice            | Size (gzip)     | Rationale                                                             |
| ------------ | ----------------- | --------------- | --------------------------------------------------------------------- |
| Build        | Vite + TypeScript | —               | Given requirement. Fast HMR, ESM-native.                              |
| UI Framework | Preact + Signals  | ~5 KB           | React-compatible API, fine-grained reactivity, tiny footprint         |
| CSS          | CSS Modules       | 0 KB runtime    | Scoped styles via Vite, zero runtime cost                             |
| Editor       | CodeMirror 6      | ~50 KB          | Markdown-native, modular, used by Obsidian, virtual viewport for perf |
| Search       | MiniSearch        | ~7 KB           | Full-text indexing, fuzzy search, prefix search, tiny bundle          |
| **Total JS** |                   | **~100–110 KB** | Well under 500KB budget                                               |

**Why Preact:** 3 KB vs React's 40+ KB. React-compat layer available. Signals
provide fine-grained reactivity without Redux/Zustand boilerplate.

**Why CodeMirror 6:** Markdown-first, composable extensions, virtual viewport
(handles large docs), TypeScript-native, battle-tested (Obsidian, Replit, Chrome
DevTools). Supports hybrid rendering via decoration plugins. Extensible for
future AI features.

**Why not ProseMirror/TipTap:** Better for WYSIWYG, but Noti is Markdown-first.
Would require building a Markdown-to-schema mapping layer. **Why not Monaco:**
2–4 MB, overkill.

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
    denote.ts             # Denote filename parsing and generation
    frontmatter.ts        # YAML front matter parsing/serialization
    note-store.ts         # In-memory note collection (Preact Signals)

  search/                 # Search Layer
    filename-search.ts    # Fast search over parsed filename metadata
    fulltext-search.ts    # MiniSearch-based content search
    search-index.ts       # Index management, lazy building, persistence

  editor/                 # Editor Layer
    editor.ts             # CodeMirror 6 setup and configuration
    markdown-ext.ts       # Hybrid Markdown extensions (rich preview)
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
```

### Data Flow

```
[User picks directory]
       │
       ▼
[FS Layer] ── scans directory, returns FileSystemHandles
       │
       ▼
[Note Model] ── parses filenames into Note objects
       │         maintains Map<id, Note> via Signals
       ▼
[Search Layer] ── filename index (instant) + full-text index (lazy)
       │
       ▼
[UI Layer] ── renders note list, search, tags from store
       │
       ▼
[Editor Layer] ── loads note content into CodeMirror, emits changes
       │
       ▼
[FS Layer] ── debounced write back to file (1–2s)
       │
       ▼
[Watcher] ── polling (5–10s) or FileSystemObserver
       │         detects external changes, triggers rescan
       ▼
[Note Model] ── reconciles, updates store → UI reacts
```

### Key Data Types

```typescript
interface Note {
  id: string; // YYYYMMDDTHHMMSS (immutable)
  title: string; // Human-readable, parsed from filename
  keywords: string[]; // Tags, parsed from filename
  signature: string | null; // Optional
  extension: string; // 'md'
  filename: string; // Full denote filename
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
- **Rename:** Create new file → write content → delete old file. Rename journal
  in OPFS for crash recovery.
- **Conflict detection:** Check `file.lastModified` before writes. If changed
  externally, prompt user.
- **Flat directory only** — no subdirectory traversal (matches denote defaults)

### Search Strategy

```
User types query
       │
       ▼
[Filename search] ── instant, always first
       │               matches title, keywords, date
       ▼
[Full-text search] ── if filename results < threshold
       │               or user requests content search
       ▼
[Merged results] ── deduplicated, ranked by relevance
```

- Filename index built synchronously on directory load (instant for 1k–10k
  notes)
- Full-text index built lazily during idle time via MiniSearch
- Index persisted in IndexedDB/OPFS for fast reload

---

## 8. Key Risks and Mitigations

| Risk                                 | Severity   | Mitigation                                                                                                             |
| ------------------------------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Chromium-only**                    | HIGH       | Clear browser compatibility notice. Target Chrome/Edge/Brave/Arc.                                                      |
| **Permission re-grant UX**           | MEDIUM     | IndexedDB handle persistence. One-click re-permission. Explain in onboarding.                                          |
| **Large notebook perf (10k+ files)** | MEDIUM     | Cache file list in IndexedDB. Load from cache first, reconcile in background. Virtualize note list. Lazy-load content. |
| **No atomic rename**                 | MEDIUM     | Write-then-delete with OPFS rename journal for crash recovery.                                                         |
| **FileSystemObserver not stable**    | LOW        | Polling fallback is the primary strategy. Observer is progressive enhancement.                                         |
| **Concurrent access conflicts**      | LOW-MEDIUM | `lastModified` check before writes. Conflict resolution UI (keep mine / keep theirs).                                  |
| **Storage quota for indexes**        | LOW        | Indexes are small (~MB). Check via `navigator.storage.estimate()`.                                                     |

---

## 9. Success Criteria

### Functional

- All P0 features working
- Core loop (create → edit → find → delete) takes under 3 actions each
- Denote filenames correctly generated and parsed
- Interoperable: files work in Emacs denote and vice versa

### Performance

- App loads in under 2 seconds
- 1,000-note directory loads list in under 3 seconds
- Note opens for editing in under 500ms
- Auto-save completes in under 200ms
- No visible jank during normal use

### Reliability

- Zero data loss under normal usage
- Graceful handling of permission denial, external conflicts, browser restart
- Works correctly after session restore (re-permission flow)

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

1. **Front matter format** — Minimal YAML (`title`, `date`, `tags`,
   `identifier`) recommended for denote interop. How strictly do we match
   denote's Emacs format?
2. **Tag sync strategy** — How do we handle bidirectional sync between inline
   `#tags` in note body and `__keywords` in filename? Which is the source of
   truth?
3. **Hybrid Markdown rendering** — Which CM6 extension/approach for hiding
   syntax when cursor is elsewhere? Custom decorations vs existing libraries
   (ink-mde, etc)?
4. **Non-denote files** — Show in a separate "Other Files" section, or silently
   ignore?
5. **Welcome note** — What content? Should it be a tutorial or just a greeting?
6. **OPFS usage** — Use for search index caching + rename journal. Any other
   uses?
