# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thought.Haus is a local-first, browser-based note-taking app. Notes are stored as plain Markdown files in a user-selected local folder using the browser File System Access API or a WebDAV server. No accounts, no sync. **Chromium** (Chrome, Edge, Brave, Arc) + **Firefox** (WebDAV only).

The repo is an **npm workspaces monorepo** with three packages:
- `@thought-haus/core` — shared library (storage backends, note types, frontmatter, filename utils)
- `@thought-haus/app` — the main web app (Preact + TipTap + MiniSearch)
- `@thought-haus/clipper` — browser extension for clipping web content into notes

## Commands

- `npm run dev` — Start app Vite dev server with HMR
- `npm run build` — Build the main app (tsc + vite)
- `npm run build:clipper` — Build the clipper extension
- `npm test` — Run all tests once (`vitest run`) across all packages
- `npm run test:watch` — Run tests in watch mode
- `npx vitest run packages/core/src/notes/filename.test.ts` — Run a single test file
- `npm run dev:webdav` — Start local WebDAV dev server

## Repository Structure

```
packages/
├── core/                       # @thought-haus/core — shared library
│   └── src/
│       ├── index.ts            # Barrel export (public API)
│       ├── storage/            # StorageBackend interface, LocalBackend, WebDavBackend
│       ├── notes/              # Note type, frontmatter parser, filename utils
│       ├── lib/                # slug, date, IndexedDB wrapper
│       └── types/              # FS Access API type declarations
├── app/                        # Main Thought.Haus web app
│   └── src/
│       ├── notes/              # note-store, note-actions (Preact Signals state)
│       ├── search/             # MiniSearch integration
│       ├── editor/             # TipTap editor + extensions
│       ├── attachments/        # Attachment service
│       ├── favorites/          # Favorites store + persistence
│       ├── agent/              # AI assistant (Pi AI)
│       ├── storage/            # scan.ts, file-watcher.ts (app-specific)
│       ├── ui/                 # Preact components
│       ├── fs/                 # Directory handle persistence
│       └── lib/                # app-state signals, router, utils
└── clipper/                    # Browser extension
    └── src/
        ├── popup/              # Extension popup UI (Preact)
        ├── background/         # Service worker
        ├── content/            # Content extraction (Readability + Turndown)
        ├── templates/          # Template engine (variables, filters, triggers)
        └── lib/                # Storage setup, browser compat
```

### Import convention

App and clipper import shared code from the core barrel:
```typescript
import { serializeFrontMatter, generateFilename } from "@thought-haus/core"
import type { StorageBackend, Note } from "@thought-haus/core"
```

## Tech Stack

- **Preact + Signals** for UI and reactive state (not React — aliased via tsconfig paths)
- **TipTap** (ProseMirror-based) for the rich-text Markdown editor
- **MiniSearch** for full-text search with fuzzy/prefix matching
- **Lucide** (`lucide-preact`) for icons throughout the UI
- **Pi AI** (`@mariozechner/pi-ai`) for the AI assistant agent
- **CSS Modules** with camelCase convention (`styles.className`)
- **Vite** for build/dev, **TypeScript** strict mode, **Vitest** with jsdom for tests
- **Iosevka Aile** as the primary UI font (loaded from CDN in index.html)
- **PWA** — installable via service worker and web manifest
- **Readability + Turndown + DOMPurify** for the clipper's content extraction pipeline
- **webextension-polyfill** for cross-browser extension compat

## Architecture

### State management (app)

Global state lives in Preact Signals exported from dedicated modules — no Redux/Zustand:
- `packages/app/src/lib/app-state.ts` — App-level signals: `appView`, `selectedNoteId`, `sidebarCollapsed`, `sidebarWidth`, `sortMode`, `sortDirection`, `themeMode`
- `packages/app/src/notes/note-store.ts` — Note collection: `notesMap` signal + computed `notesSorted`, `filteredNotes`, `tagCounts`
- `packages/app/src/search/search-engine.ts` — Search signals: `searchQuery`, `searchResults`, `isSearchActive`
- `packages/app/src/editor/editor-state.ts` — Editor signals: `saveStatus`, `wordCount`
- `packages/app/src/favorites/favorite-store.ts` — Favorites: `favoriteIds`, computed `favoriteNotes`
- `packages/app/src/agent/agent-state.ts` — AI panel: `agentPanelOpen`, `agentSettings`, `conversationMessages`, `isAgentStreaming`
- `packages/app/src/lib/command-palette-state.ts` — Command palette: `commandPaletteOpen`

### File naming scheme

Notes follow `YYYYMMDDTHHMMSS--slugified-title.md` (e.g., `20240322T131856--meeting-notes.md`). The timestamp ID is immutable. Plain `.md` files without the timestamp prefix are also supported, using their raw filename as ID.

### Key patterns

- **StorageBackend** abstracts all file I/O behind an interface (`core/src/storage/backend.ts`). `LocalBackend` wraps the FS Access API, `WebDavBackend` wraps WebDAV. All code uses the backend, never raw file handles.
- **Frontmatter** is a hand-rolled YAML parser/serializer in `core/src/notes/frontmatter.ts` (no external YAML library). Tags are the sole source of truth for organization.
- **File rename on title change**: create new file → write content → delete old file (in `note-actions.ts`).
- **Search index** is incrementally updated via `addToIndex`/`updateInIndex`/`removeFromIndex` and persisted to IndexedDB as serialized JSON.
- **File watcher** uses polling (7s interval) + window focus events, with `FileSystemObserver` as progressive enhancement.
- **Router** is hash-based (`#noteId`), syncing `selectedNoteId` signal with `window.location.hash`.
- **Note linking** uses `[[YYYYMMDDTHHMMSS]]` syntax, rendered as clickable widgets via a TipTap extension with autocomplete suggestions.
- **Attachments** are stored in per-note subdirectories (`.attachments/<noteId>/`). Images render inline; other files render as download cards.
- **Favorites** are persisted to `.thoughthouse/favorites.json` in the notes folder via the storage backend. Drag-and-drop reordering in the NavSidebar.
- **Command palette** (Cmd/Ctrl+K) is a centered overlay for note search with keyboard navigation. Uses `queryIndex()` for non-mutating search.
- **AI agent** uses Pi AI to chat with notes context. Conversations are persisted as notes tagged `th-agent-conversation`. Agent has tools to read/search/create notes.

### Clipper architecture

The clipper extension shares `@thought-haus/core` for storage and note handling:
- **Content extraction**: Readability extracts article content → DOMPurify sanitizes → Turndown converts to Markdown
- **Template system**: Templates define note structure with `{{variable|filter}}` syntax. Variables are auto-extracted from page metadata. Filters include `slug`, `blockquote`, `truncate:N`, etc. URL-based triggers auto-select templates.
- **Storage**: Reuses `StorageBackend` interface — local folder (Chromium) or WebDAV (all browsers). Config stored in `browser.storage.local`.
- **Clip modes**: Article, Selection, Full Page, Bookmark
- **Built-in templates**: Article, Bookmark, Selection, Full Page, YouTube, Recipe

### UI layout (app)

Three-column layout managed in `packages/app/src/ui/layout.tsx`: NavSidebar (fixed 220px) | NotesList (resizable) | EditorView (flex). An optional AgentPanel attaches on the right. Both the NotesList and AgentPanel widths are resizable via drag handles and persisted to localStorage. The sidebar can be collapsed with Cmd/Ctrl+\\.

### CSS

Warm palette defined as CSS custom properties in `packages/app/src/index.css` (e.g., `--color-accent: #b8621b`). Dark theme via `[data-theme="dark"]` selector with inverted warm tones. Editor-specific variables prefixed with `--editor-*`. Components use CSS Modules (`.module.css` files).

## Testing

Tests use Vitest with jsdom environment and `@testing-library/preact`. Setup file at `packages/app/src/test-setup.ts` imports `@testing-library/jest-dom/vitest` for DOM matchers. The File System Access API is not available in jsdom, so FS-dependent tests must mock `FileSystemFileHandle`/`FileSystemDirectoryHandle`.

When mocking `@thought-haus/core` in app tests, use partial mocking:
```typescript
vi.mock("@thought-haus/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@thought-haus/core")>();
  return { ...actual, testWebDavConnection: vi.fn() };
});
```

## TypeScript

Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`. Custom FS Access API types in `packages/core/src/types/fs-access.d.ts`. JSX configured for Preact (`jsxImportSource: "preact"`). Use `.ts` extensions in relative imports (`import { foo } from "./bar.ts"`). Use bare specifier for core imports (`import { foo } from "@thought-haus/core"`).
