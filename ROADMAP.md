# Noti Roadmap

Each phase delivers a usable vertical slice — something a real user can do
end-to-end — rather than building technology layers in isolation.

---

## Phase 1: Project Setup & App Shell

Establish the build pipeline and visual skeleton so every subsequent phase has a
place to land.

- [ ] Initialize Vite + TypeScript + Preact project
- [ ] Configure CSS Modules
- [ ] Create two-pane layout shell (sidebar + editor area)
- [ ] Add browser compatibility detection and notice for non-Chromium browsers
- [ ] Set up basic routing/state to switch between onboarding and main views

**Deliverable:** App loads in browser, shows empty shell with sidebar and editor
area. Non-Chromium users see a clear compatibility message.

---

## Phase 2: Open a Folder & See Your Notes

_User stories: US-1, US-7, partial US-3_

The first real value: a user picks a folder and immediately sees their existing
markdown files listed.

- [ ] Build onboarding/landing page with "Open a Folder" CTA
- [ ] Integrate `showDirectoryPicker()` to get directory handle
- [ ] Scan directory for `.md` files (flat, no subdirectories)
- [ ] Build filename parser — extract timestamp ID and title slug
- [ ] Build front matter parser — extract `title`, `date`, `tags` from YAML
- [ ] Create `Note` type and in-memory note store (Preact Signals)
- [ ] Render note list in sidebar sorted by creation date (newest first)
- [ ] Show parsed title, date groupings, and tag pills per note
- [ ] Handle non-Noti `.md` files (raw filename as title, no tags, fully usable)
- [ ] Persist directory handle in IndexedDB for session persistence
- [ ] Build returning-user flow: check saved handle, `queryPermission()`,
      one-click re-permission

**Deliverable:** User selects a folder, sees all their markdown notes listed
with titles and tags. Closing and reopening the app remembers the folder.

---

## Phase 3: Create, Edit & Delete Notes

_User stories: US-2, US-4, US-6_

The core loop: create a note, write in it, have it saved, delete what you don't
need. This is where the app becomes genuinely useful.

- [ ] Set up CodeMirror 6 with Markdown syntax highlighting
- [ ] Click note in sidebar loads its content into the editor
- [ ] Track selected note in app state; highlight in sidebar
- [ ] New note creation via `+` button and `Cmd/Ctrl+N`
- [ ] Auto-generate filename from timestamp + slugified title
- [ ] Write front matter (`title`, `date`, empty `tags`) on creation
- [ ] Immediate editor focus on new note — no dialogs
- [ ] Debounced auto-save (1–2s after last keystroke)
- [ ] Save on editor blur
- [ ] Best-effort save on `beforeunload`
- [ ] Visual save status indicator in status bar
- [ ] Word count in status bar
- [ ] Note deletion with confirmation dialog
- [ ] Remove deleted note from store and UI immediately
- [ ] Create a welcome note when user opens an empty folder

**Deliverable:** Full create → edit → auto-save → delete loop works. User can
capture thoughts, come back later, and find them saved as `.md` files on disk.

---

## Phase 4: Organize with Tags

_User story: US-5_

Users can tag notes and filter by tag — the primary organizational tool in a
flat-directory world.

- [ ] Display tag pills in editor metadata bar (below title, beside date)
- [ ] Add tags via UI (inline input or pill-based entry)
- [ ] Remove tags via UI (click X on pill)
- [ ] Tag edits write back to YAML front matter and trigger save
- [ ] Build tag list in sidebar showing all unique tags with note counts
- [ ] Click tag in sidebar to filter note list to matching notes
- [ ] Support clearing tag filter / returning to "All Notes" view
- [ ] Update tag counts reactively as notes are created/edited/deleted

**Deliverable:** User can tag notes like `#work`, `#recipes` and click a tag in
the sidebar to instantly filter their note list. Tags live in front matter and
are visible in any text editor.

---

## Phase 5: Full-Text Search

_User story: US-3 (complete)_

Any note findable in under 3 seconds via instant search across titles, tags, and
body content.

- [ ] Integrate MiniSearch with field config (title, tags as joined string,
      body)
- [ ] Configure field boosting: title 2x, tags 1.5x, body 1x
- [ ] Enable fuzzy matching and prefix search
- [ ] Build search index from all notes on startup
- [ ] Search bar in sidebar with `Cmd/Ctrl+K` to focus
- [ ] As-you-type search results replace note list in sidebar
- [ ] Display ranked results with title and relevant context
- [ ] Incremental index updates: `add()` on create, `discard()` + `add()` on
      edit, `discard()` on delete
- [ ] Persist index to IndexedDB (`JSON.stringify` / `MiniSearch.loadJSON`)
- [ ] Load from persisted index on startup when available (fast reload)
- [ ] Clear search to return to full note list

**Deliverable:** User types a query and instantly sees ranked results across all
notes. Index survives page reload via IndexedDB.

---

## Phase 6: Offline Support & Resilience

_User story: US-8 (partial)_

The app loads without a network connection and handles file conflicts
gracefully.

- [ ] Create service worker that caches app assets (HTML, JS, CSS)
- [ ] App loads fully offline after first visit
- [ ] Conflict detection: check `file.lastModified` before writes
- [ ] If file changed externally during edit, warn user and offer reload or
      overwrite

**Deliverable:** User can bookmark Noti, go offline, and it still loads and
works. Concurrent edits from other tools don't silently overwrite data.

---

## Phase 7: Note Title Renaming & External Change Detection

_User stories: US-8 (complete), P1 scope_

The app stays in sync with external changes and supports renaming notes.

- [ ] Editable title field in editor that reflects current note title
- [ ] Title change triggers file rename on disk (create new → write → delete
      old)
- [ ] Preserve original timestamp ID across renames
- [ ] Update note store and search index after rename
- [ ] Poll directory every 5–10s for external changes
- [ ] Re-scan on window focus
- [ ] Detect added files — parse and add to store + search index
- [ ] Detect deleted files — remove from store + search index
- [ ] Detect modified files — re-read content, update store + search index
- [ ] Progressive enhancement: use `FileSystemObserver` when available via
      feature detection

**Deliverable:** User can rename a note's title from within Noti and the file on
disk updates. Editing files in VS Code or Finder and switching back to Noti
reflects changes automatically.

---

## Phase 8: Keyboard Shortcuts & Note Linking

_P1 scope (remaining)_

Power-user workflows: full keyboard navigation and wiki-style linking between
notes.

- [ ] `Cmd/Ctrl+N` — new note (if not already wired)
- [ ] `Cmd/Ctrl+K` — focus search (if not already wired)
- [ ] `Cmd/Ctrl+\` — toggle sidebar
- [ ] Note linking syntax: `[[20240322T131856]]` references another note by ID
- [ ] Render `[[ID]]` links as clickable, showing target note's title
- [ ] Clicking a note link navigates to that note in the editor
- [ ] Handle broken links gracefully (target deleted → show as dead link with
      ID)

**Deliverable:** Power users can navigate entirely by keyboard. Notes can
reference each other via stable ID-based links that survive renames.

---

## Phase 9: Polish & P2 Features

Nice-to-have improvements once the core is solid.

- [ ] Hybrid Markdown rendering (hide syntax when cursor is elsewhere)
- [ ] Note templates (predefined front matter + body structure)
- [ ] Dark mode / theme support
- [ ] Sort options in sidebar (by date, title, last modified)
- [ ] Pin / favorite notes (sticky at top of list)
- [ ] Full PWA installability (manifest + install prompt)

**Deliverable:** A polished, installable app with quality-of-life features for
daily use.

---

## Out of Scope (v1)

These are explicitly **not planned** — resist the temptation:

- Sync / cloud storage
- Collaboration / sharing
- AI features
- Mobile support
- Plugins / extensions
- Nested folders
- WYSIWYG rich text
- Accounts or authentication
- Firefox / Safari support
- Import from other apps
