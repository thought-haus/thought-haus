# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thought.Haus is a local-first, browser-based note-taking app. Notes are stored as plain Markdown files in a user-selected local folder using the browser File System Access API. No server, no accounts, no sync. **Chromium-only** (Chrome, Edge, Brave, Arc).

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript check + Vite production build
- `npm test` — Run all tests once (`vitest run`)
- `npm run test:watch` — Run tests in watch mode
- `npx vitest run src/notes/filename.test.ts` — Run a single test file

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

## Architecture

### Module layers (top-down data flow)

```
src/storage/      → StorageBackend interface + LocalBackend (wraps FS Access API)
src/fs/           → Directory handle persistence (IndexedDB)
src/notes/        → Note model: Note type, filename parsing, frontmatter, store, actions
src/search/       → MiniSearch index: build, query, persist to IndexedDB
src/editor/       → TipTap editor setup, extensions/ (note links, attachments, link edit), editor state
src/attachments/  → Attachment service: save/read/delete files in per-note subdirectories
src/favorites/    → Favorites store + persistence to .thoughthouse/favorites.json
src/agent/        → AI assistant: runner, tools, conversation persistence, system prompt
src/ui/           → Preact components: App, Layout, NavSidebar, Sidebar, EditorView, AgentPanel, CommandPalette
src/lib/          → Shared: app-state signals, command-palette state, router, IndexedDB wrapper, utils
```

### State management

Global state lives in Preact Signals exported from dedicated modules — no Redux/Zustand:
- `src/lib/app-state.ts` — App-level signals: `appView`, `selectedNoteId`, `sidebarCollapsed`, `sidebarWidth`, `sortMode`, `sortDirection`, `themeMode`
- `src/notes/note-store.ts` — Note collection: `notesMap` signal + computed `notesSorted`, `filteredNotes`, `tagCounts`
- `src/search/search-engine.ts` — Search signals: `searchQuery`, `searchResults`, `isSearchActive`
- `src/editor/editor-state.ts` — Editor signals: `saveStatus`, `wordCount`
- `src/favorites/favorite-store.ts` — Favorites: `favoriteIds`, computed `favoriteNotes`
- `src/agent/agent-state.ts` — AI panel: `agentPanelOpen`, `agentSettings`, `conversationMessages`, `isAgentStreaming`
- `src/lib/command-palette-state.ts` — Command palette: `commandPaletteOpen`

State is mutated through plain functions (`setNotes`, `upsertNote`, `removeNote`) that replace the signal's Map value to trigger reactivity.

### File naming scheme

Notes follow `YYYYMMDDTHHMMSS--slugified-title.md` (e.g., `20240322T131856--meeting-notes.md`). The timestamp ID is immutable. Plain `.md` files without the timestamp prefix are also supported, using their raw filename as ID.

### Key patterns

- **StorageBackend** abstracts all file I/O behind an interface (`src/storage/backend.ts`). `LocalBackend` wraps the FS Access API. All code uses the backend, never raw file handles.
- **Frontmatter** is a hand-rolled YAML parser/serializer in `src/notes/frontmatter.ts` (no external YAML library). Tags are the sole source of truth for organization.
- **File rename on title change**: create new file → write content → delete old file (in `note-actions.ts`).
- **Search index** is incrementally updated via `addToIndex`/`updateInIndex`/`removeFromIndex` and persisted to IndexedDB as serialized JSON.
- **File watcher** uses polling (7s interval) + window focus events, with `FileSystemObserver` as progressive enhancement.
- **Router** is hash-based (`#noteId`), syncing `selectedNoteId` signal with `window.location.hash`.
- **Note linking** uses `[[YYYYMMDDTHHMMSS]]` syntax, rendered as clickable widgets via a TipTap extension with autocomplete suggestions.
- **Attachments** are stored in per-note subdirectories (`.attachments/<noteId>/`). Images render inline; other files render as download cards.
- **Favorites** are persisted to `.thoughthouse/favorites.json` in the notes folder via the storage backend. Drag-and-drop reordering in the NavSidebar.
- **Command palette** (Cmd/Ctrl+K) is a centered overlay for note search with keyboard navigation. Uses `queryIndex()` for non-mutating search.
- **AI agent** uses Pi AI to chat with notes context. Conversations are persisted as notes tagged `th-agent-conversation`. Agent has tools to read/search/create notes.

### UI layout

Three-column layout managed in `src/ui/layout.tsx`: NavSidebar (fixed 220px) | NotesList (resizable) | EditorView (flex). An optional AgentPanel attaches on the right. Both the NotesList and AgentPanel widths are resizable via drag handles and persisted to localStorage. The sidebar can be collapsed with Cmd/Ctrl+\\.

### App initialization flow (in `src/ui/app.tsx`)

1. Check browser compatibility (File System Access API)
2. Try restoring saved directory handle from IndexedDB
3. If handle exists and permission granted → scan directory, build search index, start watcher
4. If permission expired → show one-click re-permission screen
5. If no handle → show onboarding with folder picker

### CSS

Warm palette defined as CSS custom properties in `src/index.css` (e.g., `--color-accent: #b8621b`). Dark theme via `[data-theme="dark"]` selector with inverted warm tones. Editor-specific variables prefixed with `--editor-*`. Components use CSS Modules (`.module.css` files).

## Testing

Tests use Vitest with jsdom environment and `@testing-library/preact`. Setup file at `src/test-setup.ts` imports `@testing-library/jest-dom/vitest` for DOM matchers. The File System Access API is not available in jsdom, so FS-dependent tests must mock `FileSystemFileHandle`/`FileSystemDirectoryHandle`.

## TypeScript

Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`. Custom FS Access API types in `src/types/fs-access.d.ts`. JSX configured for Preact (`jsxImportSource: "preact"`). Use `.ts` extensions in imports (`import { foo } from "./bar.ts"`).
