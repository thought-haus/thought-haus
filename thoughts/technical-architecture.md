# Thought.Haus Technical Architecture

## 1. File System API: Capabilities and Constraints

### How It Works
The File System API enables web applications to read, write, and manage files on a user's local device. It requires a **secure context (HTTPS)** and is **permission-gated** -- users must explicitly grant access via file/directory pickers.

### Core Interfaces

| Interface | Purpose |
|---|---|
| `FileSystemHandle` | Base class for file or directory entries |
| `FileSystemFileHandle` | Handle for reading/writing individual files |
| `FileSystemDirectoryHandle` | Handle for traversing and managing directories |
| `FileSystemWritableFileStream` | Async writable stream for file modifications |

### Directory Access Pattern

```js
// User picks their notes directory
const dirHandle = await window.showDirectoryPicker();

// Traverse directory contents
for await (const [name, handle] of dirHandle.entries()) {
  if (handle.kind === 'file') {
    const file = await handle.getFile();
    const text = await file.text();
  }
}

// Create or access a subdirectory
const subDir = await dirHandle.getDirectoryHandle('subfolder', { create: true });

// Write a file
const fileHandle = await dirHandle.getFileHandle('note.md', { create: true });
const writable = await fileHandle.createWritable();
await writable.write('# New Note\n');
await writable.close(); // Persists to disk
```

### Permission Model
- **User-initiated only**: Access requires explicit user action via `showDirectoryPicker()`, `showOpenFilePicker()`, `showSaveFilePicker()`, or drag-and-drop.
- **Persistent handles**: `FileSystemHandle` can be serialized to IndexedDB. On subsequent visits, we can call `handle.requestPermission()` to re-prompt the user rather than re-picking.
- **No silent access**: The browser will never grant file system access without user interaction.
- **Permission prompt on revisit**: When restoring a handle from IndexedDB, the browser shows a one-click permission prompt (not the full picker).

### Browser Support
- **Chrome/Edge**: Full support (Chromium-based browsers).
- **Firefox**: Partial -- supports `showOpenFilePicker` but NOT `showDirectoryPicker`. Major gap for Thought.Haus.
- **Safari**: No support for the picker APIs. OPFS only.
- **Conclusion**: Thought.Haus is **Chromium-only** for the directory-based workflow. We should display a clear browser compatibility notice.

### Key Constraints
1. Requires HTTPS (or localhost for development).
2. Handles are origin-scoped -- one origin cannot access another's handles.
3. Writing is async-only for user-visible file system (sync writes available only in OPFS + Web Workers).
4. No atomic rename operation -- must create new file, write content, delete old file.
5. Directory iteration is async iterator-based, not synchronous.

### OPFS (Origin Private File System)
OPFS is a browser-private file system not visible to the user. It does NOT meet Thought.Haus's requirement for user-visible, portable files. However, it could be useful as a **cache/index layer** (e.g., storing search indexes). Access: `const root = await navigator.storage.getDirectory();`

---

## 2. FileSystemObserver API

### Status (as of February 2026)
- **Experimental / Non-standard** -- not part of any W3C spec yet.
- **Origin trial**: Ran from Chrome 129 (Sept 2024) to Chrome 134 (Feb 2025).
- **Intent to Ship**: Chrome team filed an Intent to Ship in Dec 2024. Likely shipping in Chrome 135+ (mid-2025 or later).
- **Other browsers**: No support in Firefox or Safari.

### How It Works

```js
const observer = new FileSystemObserver((records, observer) => {
  for (const record of records) {
    console.log(`${record.type}: ${record.changedHandle?.name}`);
    console.log(`Path: ${record.relativePathComponents.join('/')}`);
  }
});

// Observe a directory recursively
await observer.observe(dirHandle, { recursive: true });

// Stop observing
observer.disconnect();
```

### Change Record Fields
- `root`: The original handle passed to `observe()`.
- `changedHandle`: The affected file/directory handle (null for disappeared/error/unknown).
- `relativePathComponents`: Array of path segments relative to root.
- `type`: One of `"appeared"`, `"disappeared"`, `"modified"`, `"moved"`, `"unknown"`, `"errored"`.
- `relativePathMovedFrom`: Previous location (only for `"moved"` events).

### Platform Quirks
- **Windows**: Does not support `"moved"` events across directories; reports as `"disappeared"` + `"appeared"`.
- **Per-origin limits**: Max observations depend on OS resources.
- `"unknown"` type means events were missed; app should rescan/poll.
- `"errored"` means observation is invalid (permission lost, handle deleted, or limit reached).

### Recommendation for Thought.Haus
Since FileSystemObserver is experimental:
1. **Primary strategy**: Implement **polling** as the baseline. Re-scan the directory on a timer (e.g., every 5-10 seconds) or on window focus.
2. **Progressive enhancement**: If `FileSystemObserver` is available in the user's browser, use it for real-time updates and disable polling.
3. **Feature detection**: `if ('FileSystemObserver' in window) { ... }`

### Polling Implementation Strategy
```js
async function scanDirectory(dirHandle) {
  const entries = new Map();
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file' && name.endsWith('.md')) {
      const file = await handle.getFile();
      entries.set(name, { handle, lastModified: file.lastModified, size: file.size });
    }
  }
  return entries;
}
```
Compare the current scan against a cached previous scan to detect additions, deletions, and modifications (via `lastModified` timestamp).

---

## 3. Denote Naming Scheme

### Filename Format

The full denote filename pattern is:

```
IDENTIFIER==SIGNATURE--TITLE__KEYWORDS.EXTENSION
```

Where:
- **IDENTIFIER**: `YYYYMMDDTHHMMSS` (ISO 8601-like timestamp)
- **==SIGNATURE**: Optional. Prefixed by `==`. Used for sequential relations (e.g., `1a`, `2b`).
- **--TITLE**: Prefixed by `--`. Title words joined by hyphens. Slugified.
- **__KEYWORDS**: Prefixed by `__`. Individual keywords separated by `_`.
- **.EXTENSION**: File type (`.md`, `.org`, `.txt`).

### Component Rules

| Component | Required | Separator | Format | Example |
|---|---|---|---|---|
| Identifier | Yes | (none, starts filename) | `YYYYMMDDTHHMMSS` | `20240322T131856` |
| Signature | No | `==` prefix | Alphanumeric slug | `==1a2` |
| Title | No | `--` prefix | Hyphen-separated slug | `--some-note-title` |
| Keywords | No | `__` prefix, `_` between keywords | Lowercase slugs | `__project_todo` |
| Extension | Yes | `.` prefix | File extension | `.md` |

### Valid Filename Permutations

When components are omitted, these forms are valid:
- `ID.EXT` (bare minimum)
- `ID--TITLE.EXT`
- `ID__KEYWORDS.EXT`
- `ID==SIGNATURE.EXT`
- `ID==SIGNATURE--TITLE__KEYWORDS.EXT` (full form)
- `ID--TITLE__KEYWORDS.EXT` (most common, no signature)

### Slugification Rules
- Spaces become hyphens in titles.
- Special characters are removed.
- Lowercase preferred.
- Keywords are individually slugified and joined with `_`.

### Front Matter (Markdown)

```yaml
---
title:      Some Note Title
date:       2024-03-22T13:18:56
tags:       project  todo
identifier: 20240322T131856
---
```

### Parsing Strategy for Thought.Haus

```js
// Regex to parse denote filenames
const DENOTE_REGEX = /^(\d{8}T\d{6})(?:==([a-z0-9-]+))?(?:--([a-z0-9-]+))?(?:__([a-z0-9_-]+))?\.(\w+)$/;

function parseDenoteFilename(filename) {
  const match = filename.match(DENOTE_REGEX);
  if (!match) return null;

  const [, id, signature, titleSlug, keywordsSlug, ext] = match;
  return {
    id,
    signature: signature || null,
    title: titleSlug ? titleSlug.replace(/-/g, ' ') : '',
    keywords: keywordsSlug ? keywordsSlug.split('_') : [],
    extension: ext,
  };
}

function generateDenoteFilename({ title, keywords, extension = 'md' }) {
  const id = formatTimestamp(new Date()); // YYYYMMDDTHHMMSS
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const keywordsSlug = keywords.map(k => k.toLowerCase().replace(/[^a-z0-9]+/g, '-')).join('_');

  let filename = id;
  if (titleSlug) filename += `--${titleSlug}`;
  if (keywordsSlug) filename += `__${keywordsSlug}`;
  filename += `.${extension}`;
  return filename;
}
```

### Rename Strategy
When a user changes the title or keywords of a note:
1. Parse the current filename to extract the identifier.
2. Generate a new filename with the same identifier but updated title/keywords.
3. Create a new file with the new name and write content.
4. Delete the old file.
5. Update front matter inside the file to match.
6. Update any internal links pointing to the old filename (if we support wiki-links).

This is the same approach denote uses in Emacs -- the identifier is the stable reference, and the filename is reconstructed from metadata.

---

## 4. Editor Technology Recommendation

### Options Evaluated

| Editor | Type | Bundle Size (min+gzip) | Markdown Support | Rich Text | Framework Deps |
|---|---|---|---|---|---|
| **CodeMirror 6** | Code/text editor | ~50-80 KB | Native lang mode | Via extensions | None |
| **ProseMirror** | Rich document editor | ~60-80 KB | Via schema mapping | Native | None |
| **TipTap** | ProseMirror wrapper | ~100-150 KB+ | Via extension | Native | None (optional React/Vue) |
| **Monaco** | Full IDE editor | ~2-4 MB | Basic | No | None |
| **contenteditable** | Raw browser API | 0 KB | Manual | Manual | None |

### Recommendation: **CodeMirror 6**

**Why CodeMirror 6 over the alternatives:**

1. **Markdown-native**: CodeMirror 6 has first-class Markdown language support. For a note-taking app that stores `.md` files, users should see and edit actual Markdown. This keeps the mental model simple: what you write is what's in the file.

2. **Excellent extensibility**: CM6 is built on a composable extension system. We can add:
   - Syntax highlighting for Markdown
   - Rich rendering of Markdown (inline preview of bold/italic/links/images)
   - Custom keybindings
   - AI autocomplete/suggestions as extensions
   - Vim mode (community extension)

3. **Performance**: CM6 uses a virtual viewport -- only renders visible lines. Handles large documents (10k+ lines) efficiently. No DOM node per character.

4. **Modular bundle**: Import only what you need. A minimal markdown editor can be ~30-40 KB gzipped. The basic setup adds ~50 KB.

5. **No framework lock-in**: Works with any UI framework or vanilla JS. Integrates cleanly with React/Preact via a thin wrapper.

6. **Battle-tested**: Used by Obsidian (a denote-like note app), Replit, Chrome DevTools, and many others.

7. **TypeScript**: Written in TypeScript with excellent type definitions.

**Why not the others:**
- **ProseMirror**: Better for rich-text/WYSIWYG editing, but Thought.Haus's model is Markdown-first. ProseMirror requires building a Markdown-to-schema mapping layer.
- **TipTap**: Higher-level ProseMirror wrapper. Adds bundle weight and abstraction. Markdown support is a recent extension, not core. The "AI-native" marketing is for paid features.
- **Monaco**: Enormous bundle (~2-4 MB). Overkill for note-taking. Designed for IDE scenarios.
- **contenteditable**: Too much work to build reliable editing. Every note-taking app that tried has regretted it.

### Hybrid Rendering Approach
Use CodeMirror 6 with a Markdown extension that:
- Hides Markdown syntax when the cursor is not on that line (e.g., `**bold**` shows as **bold** unless you click on it).
- Renders inline images, checkboxes, and links.
- Shows code blocks with syntax highlighting.

Libraries that do this: `codemirror-rich-markdoc`, `ink-mde`, or a custom CM6 decoration plugin.

---

## 5. Search Strategy

### Filename-Based Search (Primary)
Since denote filenames encode title and keywords, we can search a LOT from filenames alone:

- **By title**: Match against the `--title` portion.
- **By keyword/tag**: Match against the `__keywords` portion.
- **By date**: Match against the identifier `YYYYMMDDTHHMMSS`.
- **By ID**: Direct lookup.

For a notebook of ~1,000-5,000 notes, filename-based search is essentially instant (iterate an in-memory array of parsed filename objects).

### Full-Text Search (Secondary)
Needed when users want to search within note content. Options:

| Library | Type | Bundle Size (min+gzip) | Speed | Best For |
|---|---|---|---|---|
| **MiniSearch** | Full-text index | ~7 KB | Fast | Small-medium datasets, great API |
| **FlexSearch** | Full-text index | ~6 KB | Fastest | Large datasets, configurable |
| **Fuse.js** | Fuzzy search | ~5 KB | Moderate | Fuzzy/typo-tolerant search |
| **lunr** | Full-text index | ~8 KB | Fast | Simple full-text, no maintenance |

### Recommendation: **MiniSearch** for full-text, with filename search as the fast path

**Why MiniSearch:**
1. Tiny bundle (~7 KB gzipped).
2. Supports prefix search, fuzzy search, and field boosting.
3. Simple API -- add documents, search, done.
4. Auto-suggestion support built in.
5. Active maintenance, good documentation.
6. Good enough performance for 1,000-10,000 notes.

**Search Architecture:**
```
User types query
  |
  v
[Filename search] -- instant, always runs first
  |                    matches on title, keywords, date
  v
[Full-text search] -- runs if filename search returns < N results
  |                    or user explicitly requests "search in content"
  v
[Merged results] -- deduplicated, ranked by relevance
```

**Index Building:**
- On directory load, parse all filenames and build the filename index (instant).
- Lazily build the full-text index: read file contents in batches during idle time.
- Store the full-text index in OPFS or IndexedDB for fast reload on subsequent visits.
- Rebuild incrementally when files change.

---

## 6. Tech Stack Recommendation

### Core Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Build** | Vite + TypeScript | Given requirement. Fast HMR, ESM-native. |
| **UI Framework** | **Preact** | 3 KB gzipped. React-compatible API. Signals for reactivity. No virtual DOM overhead for simple UIs. |
| **State Management** | **Preact Signals** | Built into Preact. Fine-grained reactivity without boilerplate. No separate state library needed. |
| **CSS** | **CSS Modules** (via Vite) | Scoped styles, zero runtime, no extra dependencies. Alternatively: vanilla CSS with BEM if we want maximum simplicity. |
| **Editor** | CodeMirror 6 | See section 4. |
| **Search** | MiniSearch | See section 5. |
| **Icons** | None / inline SVG | Keep deps minimal. A few hand-picked SVGs for the UI. |

### Why Preact over alternatives:

- **vs React**: 3 KB vs 40+ KB. Thought.Haus is a focused app, not a complex SPA. Preact's compat layer means we can use React ecosystem if needed.
- **vs Solid**: Solid is excellent but smaller ecosystem. Preact has broader library compatibility through React compat.
- **vs Svelte**: Svelte compiles away but the compiler adds build complexity. Less relevant for a Vite project. Smaller ecosystem for editor integration.
- **vs Vanilla JS**: Possible, but managing state and DOM updates manually for a note list + editor + sidebar would be tedious. A lightweight framework pays for itself.

### Key Dependencies (estimated total JS budget: ~100-150 KB gzipped)

```
preact + signals          ~5 KB
codemirror (core + md)   ~50 KB
minisearch               ~7 KB
---------------------------------
~62 KB core
+ editor extensions      ~20-30 KB
+ app code               ~15-20 KB
---------------------------------
~100-110 KB total
```

---

## 7. Architecture Overview

### Module Breakdown

```
noti/
  src/
    fs/                     # File System Layer
      directory.ts          # Directory picker, handle management, IndexedDB persistence
      file-ops.ts           # Read, write, create, delete, rename files
      watcher.ts            # FileSystemObserver + polling fallback
      permissions.ts        # Permission checking and re-requesting

    notes/                  # Note Model Layer
      note.ts               # Note type definition and parsing
      denote.ts             # Denote filename parsing and generation
      frontmatter.ts        # YAML front matter parsing/serialization
      note-store.ts         # In-memory note collection, signals-based state

    search/                 # Search Layer
      filename-search.ts    # Fast search over parsed filename metadata
      fulltext-search.ts    # MiniSearch-based content search
      search-index.ts       # Index management, lazy building, persistence

    editor/                 # Editor Layer
      editor.ts             # CodeMirror 6 setup and configuration
      markdown-ext.ts       # Custom Markdown extensions (rich preview, etc.)
      keybindings.ts        # Custom keybindings

    ui/                     # UI Layer
      app.tsx               # Root component
      sidebar.tsx           # Note list, search, tag filter
      editor-view.tsx       # Editor wrapper component
      toolbar.tsx           # Note actions (rename, tag, delete)
      onboarding.tsx        # First-run directory picker flow
      browser-check.tsx     # Browser compatibility notice

    lib/                    # Shared Utilities
      date.ts               # Timestamp formatting
      slug.ts               # Slugification functions
      debounce.ts           # Debounce/throttle helpers
```

### Data Flow

```
[User picks directory]
        |
        v
[FS Layer] -- scans directory, returns FileSystemHandles
        |
        v
[Note Model] -- parses filenames into Note objects
        |        maintains in-memory Map<id, Note>
        v
[Search Layer] -- builds filename index immediately
        |          builds full-text index lazily
        v
[UI Layer] -- renders note list from note store
        |      filters via search
        v
[Editor Layer] -- loads selected note content into CodeMirror
        |          emits changes
        v
[FS Layer] -- writes changes back to file (debounced)
        |
        v
[Watcher] -- detects external changes, triggers rescan
        |
        v
[Note Model] -- reconciles changes, updates store
```

### Key Data Types

```ts
interface Note {
  id: string;                 // YYYYMMDDTHHMMSS
  title: string;              // Human-readable title
  keywords: string[];         // Tags
  signature: string | null;   // Optional sequence marker
  extension: string;          // 'md', 'org', 'txt'
  filename: string;           // Full filename
  fileHandle: FileSystemFileHandle;
  lastModified: number;       // Timestamp from File.lastModified
  size: number;               // File size in bytes
}

interface NoteContent {
  frontmatter: Record<string, unknown>;
  body: string;               // Markdown body after front matter
}

interface NoteStore {
  notes: Signal<Map<string, Note>>;
  selectedNoteId: Signal<string | null>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
}
```

### State Management Pattern

Using Preact Signals for reactive state:

```ts
import { signal, computed } from '@preact/signals';

// Core state
const notes = signal(new Map<string, Note>());
const selectedNoteId = signal<string | null>(null);
const searchQuery = signal('');

// Derived state
const selectedNote = computed(() =>
  selectedNoteId.value ? notes.value.get(selectedNoteId.value) : null
);

const filteredNotes = computed(() => {
  if (!searchQuery.value) return [...notes.value.values()];
  return searchByFilename(searchQuery.value, notes.value);
});
```

### Save Strategy
- **Debounced auto-save**: Write to file 1-2 seconds after the user stops typing.
- **No explicit save button**: Changes persist automatically.
- **Conflict detection**: Before writing, check `file.lastModified`. If it changed externally since we last read it, warn the user.

---

## 8. Key Technical Risks and Constraints

### Risk 1: Browser Compatibility (HIGH)
- **Impact**: Thought.Haus only works in Chromium browsers (Chrome, Edge, Brave, Arc).
- **Mitigation**: Clear messaging on landing page. "Works best in Chrome" badge. Graceful degradation message for unsupported browsers.
- **Firefox**: Has partial File System API but no `showDirectoryPicker()`. Cannot support Thought.Haus's core workflow.
- **Safari**: No File System API picker support at all.

### Risk 2: Permission UX Friction (MEDIUM)
- **Impact**: Users must re-grant permission each browser session (or after inactivity). The permission prompt is browser-controlled and cannot be customized.
- **Mitigation**: Store handle in IndexedDB. On return visit, call `handle.requestPermission({ mode: 'readwrite' })` which shows a less intrusive prompt. Explain the flow during onboarding.

### Risk 3: Large Notebook Performance (MEDIUM)
- **Impact**: A directory with 10,000+ files could be slow to scan. Each file requires an async operation to get metadata.
- **Mitigation**:
  - Cache the file list and metadata in IndexedDB/OPFS.
  - On startup, load from cache first (instant), then reconcile with actual directory in background.
  - Paginate/virtualize the note list UI.
  - Lazy-load file contents (only read when user selects a note).
  - Build full-text search index incrementally during idle time.

### Risk 4: No Atomic Rename (MEDIUM)
- **Impact**: Renaming a denote file (title/keyword change) requires create + write + delete. If the process is interrupted, we could have duplicate files or data loss.
- **Mitigation**:
  - Write new file first, verify it exists, then delete old file.
  - Keep a rename journal in OPFS to recover from interrupted renames.

### Risk 5: FileSystemObserver Availability (LOW)
- **Impact**: Without the observer API, we cannot detect external file changes in real-time.
- **Mitigation**: Polling fallback (already planned). Poll on window focus and on a timer. The observer is a progressive enhancement, not a dependency.

### Risk 6: Concurrent Access (LOW-MEDIUM)
- **Impact**: If the user edits the same file in Thought.Haus and an external editor simultaneously, changes could overwrite each other.
- **Mitigation**:
  - Check `lastModified` before every write.
  - If external change detected while user has unsaved changes, show a conflict resolution UI (keep mine / keep theirs / merge).
  - Use the `FileSystemObserver` (when available) to detect external modifications quickly.

### Risk 7: Storage Quota for Indexes (LOW)
- **Impact**: Full-text search indexes stored in OPFS/IndexedDB count against the origin's storage quota.
- **Mitigation**: Indexes are typically small (a few MB for thousands of notes). Use `navigator.storage.estimate()` to check available space. Compress indexes if needed.

### Risk 8: PWA / Offline Support (LOW - FUTURE)
- **Impact**: As a browser app, Thought.Haus requires the browser to be open. Users may expect native-app-like behavior.
- **Mitigation**: Register a Service Worker for offline caching of app assets. The actual notes are on the local file system, so they're always "available" -- but the app needs to be loaded to access them. Future consideration: make Thought.Haus installable as a PWA.

---

## Summary of Key Decisions

| Decision | Choice | Confidence |
|---|---|---|
| File access | File System API (`showDirectoryPicker`) | High |
| Target browsers | Chromium-only (Chrome, Edge, Brave, Arc) | High |
| File watching | Polling + FileSystemObserver progressive enhancement | High |
| Naming scheme | Denote (`ID--TITLE__KEYWORDS.EXT`) | High (given requirement) |
| Editor | CodeMirror 6 | High |
| UI framework | Preact + Signals | Medium-High |
| Search | Filename search + MiniSearch for full-text | High |
| CSS | CSS Modules | Medium |
| State management | Preact Signals | Medium-High |
| Build tool | Vite + TypeScript | High (given requirement) |
