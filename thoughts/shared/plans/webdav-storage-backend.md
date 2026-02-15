# WebDAV Storage Backend — Design Plan

## Problem

Thought.Haus is locked to desktop Chromium browsers because it depends on the File System Access API for all note storage. Mobile browsers don't support this API, and non-Chromium desktop browsers have limited or no support. Adding WebDAV as an alternative storage backend unlocks browser-based access from any device — phone, tablet, or any desktop browser — as long as the user has a WebDAV server.

## Design Principle

Local FS and WebDAV should behave identically from the app's perspective. The same note model, search index, editor, sidebar, and UI all work unchanged regardless of which backend is active. The difference is purely in how bytes get to and from storage.

---

## Storage Backend Interface

A new `StorageBackend` interface abstracts all file system operations. Both backends implement it, and all app code goes through it — no direct `FileSystemFileHandle` or `fetch()` calls scattered through the codebase.

```ts
interface StorageBackend {
  readonly type: "local" | "webdav"

  // Lifecycle
  connect(config: BackendConfig): Promise<void>
  restore(): Promise<boolean>
  disconnect(): void

  // File operations
  list(): Promise<FileEntry[]>
  read(filename: string): Promise<string>
  write(filename: string, content: string): Promise<void>
  create(filename: string, content: string): Promise<void>
  delete(filename: string): Promise<void>
  getMetadata(filename: string): Promise<FileMeta>

  // Change detection
  watch(onChange: (changes: FileChange[]) => void): () => void
}

interface FileEntry {
  filename: string
  lastModified: number
  size: number
}

interface FileMeta {
  lastModified: number
  size: number
}

type BackendConfig =
  | { type: "local" }
  | { type: "webdav"; url: string; username: string; password: string }
```

### Why filenames, not handles

The current code passes `FileSystemFileHandle` objects around — the `Note` type embeds one, and call sites use it directly. WebDAV has no equivalent concept; files are addressed by URL path (effectively, by name). The common denominator is the filename string, which already exists on every `Note` and is immutable for the note's lifetime.

This means removing `fileHandle` from the `Note` type. The backend holds whatever internal references it needs (the local backend caches a `Map<string, FileSystemFileHandle>` internally), but consumers only see filenames.

---

## Note Type Change

```ts
// Before
interface Note {
  id: string
  title: string
  tags: string[]
  filename: string
  fileHandle: FileSystemFileHandle  // removed
  lastModified: number
  size: number
  isTimestampFormat: boolean
  createdAt: Date
}

// After
interface Note {
  id: string
  title: string
  tags: string[]
  filename: string
  lastModified: number
  size: number
  isTimestampFormat: boolean
  createdAt: Date
}
```

Every call site that currently does `note.fileHandle.getFile()` or `readNoteContent(note.fileHandle)` changes to `backend.read(note.filename)` or `backend.getMetadata(note.filename)`.

---

## Local FS Backend Implementation

Wraps the existing File System Access API code. Internally holds:
- `dirHandle: FileSystemDirectoryHandle` — the opened directory
- `handleCache: Map<string, FileSystemFileHandle>` — populated on `list()` and `create()`, used by `read()`/`write()`/`getMetadata()`

```
list()          → dirHandle.entries() → filter .md → getFile() for metadata
read(filename)  → handleCache.get(filename).getFile().text()
write(filename) → handleCache.get(filename).createWritable() → write → close
create(filename)→ dirHandle.getFileHandle(filename, {create:true}) → write
delete(filename)→ dirHandle.removeEntry(filename)
getMetadata()   → handleCache.get(filename).getFile() → {lastModified, size}
watch()         → polling (7s) + focus event + FileSystemObserver (same as today)
connect()       → window.showDirectoryPicker({mode:"readwrite"})
restore()       → load handle from IndexedDB → checkPermission/requestPermission
disconnect()    → stop watcher, clear handleCache
```

This is largely a reorganization of existing code in `src/fs/`, not a rewrite.

---

## WebDAV Backend Implementation

Uses `fetch()` with WebDAV HTTP methods. Internally holds:
- `baseUrl: string` — the WebDAV collection URL (e.g., `https://dav.example.com/notes/`)
- `authHeader: string` — `"Basic " + btoa(username + ":" + password)`

### HTTP Method Mapping

| Operation | HTTP Method | Details |
|-----------|-------------|---------|
| `list()` | `PROPFIND` (Depth: 1) | Parse multistatus XML for `.md` entries, extract `getlastmodified` and `getcontentlength` |
| `read(filename)` | `GET` | Response body as text |
| `write(filename)` | `PUT` | Send content as request body |
| `create(filename)` | `PUT` | Same as write — WebDAV PUT creates if absent |
| `delete(filename)` | `DELETE` | |
| `getMetadata(filename)` | `PROPFIND` (Depth: 0) | Parse single resource props |
| `watch()` | Polling with `PROPFIND` | Diff against cached file list, same interval as local (7s) |
| `connect()` | Test `PROPFIND` on collection | Validates URL + credentials |
| `restore()` | Load config from IndexedDB, test `PROPFIND` | Validates server is reachable |

### PROPFIND Response Parsing

WebDAV returns XML multistatus responses. We'll need a lightweight parser — `DOMParser` is built into browsers and sufficient:

```ts
async function listFiles(baseUrl: string, authHeader: string): Promise<FileEntry[]> {
  const res = await fetch(baseUrl, {
    method: "PROPFIND",
    headers: {
      Authorization: authHeader,
      Depth: "1",
      "Content-Type": "application/xml",
    },
    body: `<?xml version="1.0"?>
      <propfind xmlns="DAV:">
        <prop>
          <getlastmodified/>
          <getcontentlength/>
        </prop>
      </propfind>`,
  })
  const xml = new DOMParser().parseFromString(await res.text(), "application/xml")
  // parse <response> elements, filter to .md files, extract props
}
```

No external XML library needed.

### URL Construction

Files are addressed as `${baseUrl}${encodeURIComponent(filename)}`. The `baseUrl` must end with `/`. We normalize this on connect.

---

## Search Index with WebDAV

### The challenge

The current startup flow reads every note's content to build/update the MiniSearch index. Over WebDAV, that's N HTTP requests — unacceptable for a vault with hundreds of notes.

### Solution: Incremental index updates

The search index is already persisted to IndexedDB. We leverage this:

1. **On startup:** Load the persisted MiniSearch index from IndexedDB (instant, local)
2. **`PROPFIND`** the collection to get filenames + `lastModified` for all `.md` files
3. **Diff** against what's already indexed (compare filenames and `lastModified`)
4. **Fetch content only for new/changed notes** — add/update them in the index
5. **Remove deleted notes** from the index
6. **Persist** the updated index back to IndexedDB

For a vault with 200 notes where 3 changed since last session: 1 PROPFIND + 3 GETs instead of 200 GETs. First-time setup with a new vault is still N requests, but that's a one-time cost and can happen progressively.

### Index metadata tracking

To know what's changed, the index needs to track `lastModified` per document. MiniSearch supports storing arbitrary fields — we'll store `lastModified` alongside each indexed document so we can diff without a separate lookup table.

### This improves local FS too

The same incremental approach can be used for the local backend. Currently it re-reads all note content on every startup. With incremental updates, startup only reads notes that actually changed — faster for large local vaults too.

---

## App State Changes

```ts
// Before (app-state.ts)
export const directoryHandle = signal<FileSystemDirectoryHandle | null>(null)
export const savedHandle = signal<FileSystemDirectoryHandle | null>(null)

// After
export const storageBackend = signal<StorageBackend | null>(null)
```

All code that currently reads `directoryHandle.value` and calls handle methods will instead call methods on `storageBackend.value`.

---

## Credential & Config Persistence

Both backends persist their configuration to IndexedDB so sessions can be restored:

| Backend | What's stored | IndexedDB key |
|---------|---------------|---------------|
| Local | `FileSystemDirectoryHandle` (structured clone) | `"backend-local"` |
| WebDAV | `{ url, username, password }` | `"backend-webdav"` |

Additionally, we store which backend type is active: `{ type: "local" | "webdav" }` under key `"backend-active"`. On startup, read the active type, then restore the appropriate backend.

WebDAV credentials are stored as plaintext in IndexedDB. This is acceptable — IndexedDB is same-origin and no less secure than cookies or localStorage. The user's browser security model protects it.

---

## Initialization Flow

### Current flow
1. Check browser compatibility (File System Access API)
2. Try restoring directory handle from IndexedDB
3. If handle + permission → scan, build index, start watcher
4. If permission expired → show re-permission screen
5. If no handle → show onboarding (folder picker)

### New flow
1. Check which backends are available (local = File System Access API present; WebDAV = always available)
2. Read `"backend-active"` from IndexedDB
3. If found → instantiate that backend → call `restore()`
   - If restore succeeds → `list()` → build/update notes + search index → `watch()`
   - If restore fails (permission expired for local, server unreachable for WebDAV) → show reconnect screen
4. If not found → show onboarding with backend choice

### Onboarding screen

Two paths presented side-by-side or as tabs:

**Local Folder** — "Store notes as Markdown files in a folder on this computer. Requires Chrome, Edge, or Brave."
- Shows folder picker button
- Only shown if File System Access API is available

**WebDAV Server** — "Connect to a WebDAV server to access notes from any device and browser."
- URL field (e.g., `https://dav.example.com/notes/`)
- Username field
- Password field
- "Test Connection" button → tries `PROPFIND`, shows success/error
- "Connect" button (enabled after successful test)

---

## Backend Switching

Available in settings. The flow:

1. User clicks "Change storage" in settings
2. Current backend is disconnected (watcher stopped, state cleared)
3. Notes map and search index are cleared
4. User is returned to the onboarding/connection screen
5. They pick a new backend (or the same one with different config)

There is no migration — switching backends starts fresh. The user is responsible for having their notes in both locations if they want continuity. This is simple and avoids a whole class of sync/conflict problems.

---

## CORS

WebDAV requests from a browser are cross-origin `fetch()` calls. Browsers enforce CORS, and most WebDAV servers don't set `Access-Control-Allow-*` headers by default.

### What the user needs

Their WebDAV server must respond to preflight `OPTIONS` requests with:
```
Access-Control-Allow-Origin: *  (or the specific origin)
Access-Control-Allow-Methods: GET, PUT, DELETE, PROPFIND, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Depth
```

### What we do

- On the WebDAV connection form, include a brief note: "Your WebDAV server must allow CORS requests from this origin."
- When a connection test fails due to CORS (detectable: `fetch()` throws a `TypeError` with no response), show a specific error message explaining CORS and linking to setup docs.
- Provide documentation for common WebDAV servers (Nextcloud, Nginx + webdav module, Apache mod_dav) with CORS configuration examples.

### Future option: service worker proxy

If CORS proves to be too much friction, a service worker could proxy WebDAV requests (since service workers aren't subject to CORS for server-to-server-like requests). This is a future optimization, not required for v1.

---

## File Structure

### Before
```
src/fs/
  directory.ts        — picker, persistence, permissions
  file-ops.ts         — scan, read, write
  file-watcher.ts     — polling, diffing, FileSystemObserver
```

### After
```
src/storage/
  backend.ts          — StorageBackend interface + types
  local-backend.ts    — File System Access API implementation
  webdav-backend.ts   — WebDAV fetch implementation
  webdav-xml.ts       — PROPFIND response parser
  file-watcher.ts     — Generic polling/diff logic (shared by both backends)
  persistence.ts      — IndexedDB save/load for backend configs
```

The old `src/fs/` directory is removed. All imports are updated to point to `src/storage/`.

---

## Migration Scope

### Files to modify (consumer code)

| File | What changes |
|------|-------------|
| `src/notes/note.ts` | Remove `fileHandle` field |
| `src/lib/app-state.ts` | Replace `directoryHandle`/`savedHandle` signals with `storageBackend` signal |
| `src/notes/note-actions.ts` | All FS operations go through `storageBackend.value` |
| `src/ui/app.tsx` | New init flow, backend selection, onboarding branching |
| `src/ui/editor-view.tsx` | `read()`/`write()` through backend instead of file handles |
| `src/agent/tools.ts` | Same pattern — backend methods |
| `src/agent/conversation-persistence.ts` | Same pattern |
| `src/agent/note-mention.ts` | `readNoteContent()` → `backend.read()` |
| `src/agent/system-prompt.ts` | Same |
| `src/agent/command-loader.ts` | Same |
| `src/search/search-engine.ts` | Incremental index update logic |
| `src/lib/browser.ts` | Update compatibility check to account for WebDAV-only mode |

### Files to create

| File | Purpose |
|------|---------|
| `src/storage/backend.ts` | Interface + types |
| `src/storage/local-backend.ts` | Local FS implementation |
| `src/storage/webdav-backend.ts` | WebDAV implementation |
| `src/storage/webdav-xml.ts` | PROPFIND XML parsing |
| `src/storage/persistence.ts` | Backend config save/restore |
| `src/ui/webdav-connect.tsx` | WebDAV connection form component |

### Files to delete

| File | Reason |
|------|--------|
| `src/fs/directory.ts` | Absorbed into `local-backend.ts` + `persistence.ts` |
| `src/fs/file-ops.ts` | Absorbed into `local-backend.ts` |
| `src/fs/file-watcher.ts` | Generalized into `src/storage/file-watcher.ts` |

### Tests to update

| File | What changes |
|------|-------------|
| `src/fs/file-ops.test.ts` | Move to `src/storage/local-backend.test.ts`, mock via interface |
| `src/fs/file-watcher.test.ts` | Move to `src/storage/file-watcher.test.ts` |
| New: `src/storage/webdav-backend.test.ts` | Mock `fetch()`, test PROPFIND parsing, CRUD operations |

---

## Implementation Order

A suggested sequencing that keeps the app working at every step:

1. **Define the interface** — `src/storage/backend.ts` with `StorageBackend`, types
2. **Build the local backend** — Port existing `src/fs/` code into `LocalBackend` class implementing the interface. Keep old `src/fs/` temporarily.
3. **Update the Note type** — Remove `fileHandle`, update all consumer code to go through the backend signal. This is the largest single step.
4. **Wire up app init** — Replace `directoryHandle` signal with `storageBackend`, update `app.tsx` init flow. At this point the app works exactly as before, just through the new abstraction.
5. **Delete old `src/fs/`** — Clean up.
6. **Build the WebDAV backend** — `WebDavBackend` class + XML parser. Can be developed and tested independently.
7. **Incremental search index** — Update `search-engine.ts` to diff by `lastModified` instead of re-reading everything.
8. **Onboarding UI** — Backend selection screen, WebDAV connection form.
9. **Backend switching** — Settings UI to disconnect and reconnect.

Steps 1-5 are a refactor with no behavior change. Steps 6-9 add WebDAV support. This split means the refactor can be shipped and validated before WebDAV lands.
