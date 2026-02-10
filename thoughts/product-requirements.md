# Noti v1 - Product Requirements & Scope

## Product Vision

Noti is a **local-first, browser-based note-taking app** inspired by the original Evernote simplicity. It stores notes as plain files in a user-selected local folder using the browser File System API. There is no server, no sync service -- the file system IS the database. Files follow the **denote naming scheme** for structured, human-readable filenames.

## Core Value Proposition

| | Noti | Obsidian | Bear | Notion |
|---|---|---|---|---|
| Runs in browser | Yes | No (Electron) | No (native) | Yes (cloud) |
| Zero install | Yes | No | No | N/A (SaaS) |
| Local files | Yes | Yes | No | No |
| No account required | Yes | Yes | Yes | No |
| Denote-compatible | Yes | No | No | No |
| Works offline | Yes | Yes | Yes | No |
| Cross-platform | Any Chromium browser | Desktop only | Apple only | Any browser |

**What makes Noti different**: Zero-install, runs entirely in the browser, stores plain files on the local file system with no proprietary format, and uses the denote naming convention for interoperability with Emacs denote users. Your notes are just files -- readable, movable, and yours.

---

## Research: Denote Naming Scheme

### Filename Format

```
ID--TITLE__KEYWORDS.EXT
```

| Component | Format | Separator | Required | Example |
|-----------|--------|-----------|----------|---------|
| **ID** | Timestamp `YYYYMMDDTHHMMSS` | (none, starts filename) | Yes | `20240322T131856` |
| **Signature** | Alphanumeric string | `==` prefix | No | `==1a2` |
| **Title** | Slugified (lowercase, hyphens for spaces) | `--` prefix | No | `--some-title` |
| **Keywords** | Underscore-separated, alphabetically sorted | `__` prefix | No | `__topic1_topic2` |
| **Extension** | Standard file extension | `.` | Yes | `.md` |

### Valid Filename Permutations

- `20240322T131856--some-title__topic1_topic2.md` (full)
- `20240322T131856--some-title.md` (no keywords)
- `20240322T131856__topic1_topic2.md` (no title)
- `20240322T131856.md` (ID only)

### Rules for Noti

1. **ID generation**: Use `YYYYMMDDTHHMMSS` format based on creation time. Must be unique within the directory.
2. **Title slugification**: Lowercase, replace spaces with hyphens, strip non-alphanumeric characters (except hyphens).
3. **Keyword rules**: Lowercase, alphabetically sorted, separated by single underscores.
4. **Immutable ID**: The ID (creation timestamp) never changes, even when renaming.
5. **Rename = file rename**: Changing title or tags means renaming the file on disk.

### Implications for Noti

- **Search by filename**: Tags and title are in the filename, enabling fast filtering without reading file contents.
- **Sort by date**: The ID prefix means lexicographic sort = chronological sort.
- **Interoperability**: Files created by Noti can be opened and managed by Emacs denote, and vice versa.
- **No metadata database needed**: The filename carries all the metadata we need for v1.

---

## Research: File System API Capabilities

### What We Can Use (Baseline: March 2023+)

| Capability | API | Status |
|---|---|---|
| **Pick a folder** | `window.showDirectoryPicker()` | Stable, Chromium |
| **List files** | `FileSystemDirectoryHandle.entries()` | Stable |
| **Read file** | `FileSystemFileHandle.getFile()` | Stable |
| **Write file** | `FileSystemWritableFileStream` | Stable |
| **Create file** | `getFileHandle(name, { create: true })` | Stable |
| **Delete file** | `FileSystemDirectoryHandle.removeEntry(name)` | Stable |
| **Watch for changes** | `FileSystemObserver` | **Experimental, Chrome-only** |

### Key Constraints

1. **Chromium-only for full support**: `showDirectoryPicker()` is not supported in Firefox or Safari. This means Noti v1 is a **Chromium-browser app** (Chrome, Edge, Brave, Arc, etc.).
2. **HTTPS required**: Must be served over HTTPS or localhost.
3. **User must grant permission**: The folder picker is the permission gate. Permission may need to be re-granted on browser restart.
4. **No native file watching**: `FileSystemObserver` is experimental. We need a **polling fallback** (re-scan directory periodically) for detecting external changes.
5. **No arbitrary path access**: We can only access the folder the user explicitly selected.
6. **Handle persistence**: `FileSystemDirectoryHandle` can be stored in IndexedDB to remember the user's folder across sessions, but permission re-grant via a user gesture is still needed.

### Architecture Implications

- **Permission flow**: On first visit, prompt user to select folder. Store handle in IndexedDB. On return, request permission re-grant with a button click.
- **File listing**: Use `for await (const [name, handle] of dirHandle.entries())` to enumerate notes.
- **File operations**: All async. Create/write via `createWritable()`, read via `getFile()`, delete via `removeEntry()`.
- **External change detection**: Poll the directory on a timer (e.g., every 5-10 seconds) and diff the file list. Upgrade to `FileSystemObserver` when it becomes stable.
- **Subdirectories**: For v1, flat directory only (no nested folders). Denote itself uses a flat structure by default.

---

## MVP Feature Set

### P0 - Launch Blockers (Must Ship)

These are the absolute minimum features required for Noti to be usable as a note-taking app:

1. **Folder selection & persistence**
   - User selects a local folder via `showDirectoryPicker()`
   - Handle stored in IndexedDB for session persistence
   - Re-permission flow on return visits

2. **Note listing from directory**
   - Scan selected directory for files matching denote naming pattern
   - Display notes in a sidebar list sorted by creation date (newest first)
   - Show parsed title and tags from filename
   - Also display non-denote files gracefully (show raw filename)

3. **Note creation**
   - Create new note with title (optional) and tags (optional)
   - Auto-generate denote-format filename with current timestamp ID
   - Write file to the selected directory
   - Default to `.md` extension

4. **Note reading & editing**
   - Open note content in an editor pane
   - Markdown editing (plain text with markdown support)
   - Auto-save on change (debounced, e.g., 1-2 seconds after last keystroke)

5. **Note deletion**
   - Delete note file from directory
   - Confirmation dialog before delete

6. **Tag display & filtering**
   - Parse tags from filenames
   - Show tag list/cloud in sidebar
   - Click tag to filter notes list

### P1 - Important (Ship Soon After Launch)

7. **Note renaming (title & tag editing)**
   - Edit title and tags of existing note
   - Renames the file on disk (preserving the original ID)
   - Handles potential naming conflicts

8. **Search / filter by title**
   - Text input to filter notes list by title substring
   - Instant filtering as user types

9. **External change detection**
   - Periodic directory re-scan (polling)
   - Detect new files, deleted files, renamed files
   - Update the UI automatically

10. **Keyboard shortcuts**
    - `Cmd/Ctrl+N` for new note
    - `Cmd/Ctrl+S` for explicit save (even though auto-save exists)
    - `Cmd/Ctrl+Shift+F` for search
    - `Cmd/Ctrl+Backspace` for delete

11. **Markdown preview**
    - Toggle between edit and preview mode
    - Or side-by-side split view

### P2 - Nice to Have (Future)

12. **Full-text search** (search within file contents, not just filenames)
13. **Signature support** (the `==` component of denote filenames)
14. **Note templates** (pre-filled content for new notes)
15. **Dark mode / theme support**
16. **Export / bulk operations**
17. **File type support** beyond `.md` (`.txt`, `.org`)
18. **Drag and drop** files into the app
19. **Sort options** (by date, by title, by last modified)
20. **Pin/favorite notes**

---

## Non-Goals for v1

These are things we are **explicitly NOT building** in v1:

- **No sync / cloud storage**: Files live only on the local machine. Use Dropbox/iCloud/Syncthing externally if you want sync.
- **No collaboration / sharing**: Single-user only.
- **No AI features**: No AI summarization, no AI search, no AI anything.
- **No mobile support**: File System API requires Chromium desktop. Mobile is not a target.
- **No plugins / extensions**: No plugin system, no API.
- **No nested folders / notebooks**: Flat directory structure only (matching denote defaults).
- **No WYSIWYG rich text**: Markdown editing only, not a rich text editor.
- **No Electron / desktop app wrapper**: Browser-only.
- **No user accounts or authentication**: Zero auth. Open the page, pick a folder, start writing.
- **No import from other apps**: No Evernote/Notion/Obsidian importers (users can manually drop `.md` files).
- **No end-to-end encryption**: Files are plain text on disk.
- **No Firefox / Safari support**: Chromium-only due to File System API.

---

## User Stories

### US-1: First-time Setup
**As a** new user, **I want to** select a folder on my computer to store my notes, **so that** I can start using Noti without creating an account or installing anything.

**Acceptance criteria:**
- Landing page clearly explains what Noti does and how it works
- Single "Choose Folder" button triggers the native directory picker
- After selection, immediately shows the notes list (even if empty)
- Folder choice is remembered across browser sessions

### US-2: Create a Note
**As a** user, **I want to** quickly create a new note with a title and optional tags, **so that** I can capture my thoughts immediately.

**Acceptance criteria:**
- New note action is prominent and accessible (button + keyboard shortcut)
- Can enter a title and tags during or after creation
- File is created on disk with correct denote filename format
- Editor opens immediately for the new note
- Focus is in the editor body, ready to type

### US-3: Browse and Find Notes
**As a** user, **I want to** see all my notes in a list and filter by tag or search by title, **so that** I can quickly find what I'm looking for.

**Acceptance criteria:**
- Sidebar shows all notes sorted by creation date (newest first)
- Each note shows its title and tags
- Clicking a tag filters the list to notes with that tag
- Search box filters notes by title as I type
- Clear/reset filter is easy to find

### US-4: Edit and Auto-save
**As a** user, **I want to** edit a note and have changes saved automatically, **so that** I never lose my work and don't have to think about saving.

**Acceptance criteria:**
- Clicking a note opens it in the editor
- Changes are auto-saved after a brief pause in typing (1-2 seconds)
- Visual indicator shows save state (saved / saving / unsaved)
- Manual save via `Cmd/Ctrl+S` also works
- No data loss on browser close (save triggers on blur/beforeunload)

### US-5: Organize with Tags
**As a** user, **I want to** add, remove, and filter by tags, **so that** I can organize my notes without managing folders.

**Acceptance criteria:**
- Tags are visible on each note in the list
- Tag sidebar or panel shows all unique tags with note counts
- Clicking a tag filters the note list
- Can edit tags on an existing note (which renames the file)
- Tags are sorted alphabetically per denote convention

### US-6: Delete a Note
**As a** user, **I want to** delete a note I no longer need, **so that** my notes folder stays clean.

**Acceptance criteria:**
- Delete action available in note view or context menu
- Confirmation dialog prevents accidental deletion
- File is removed from disk
- Note list updates immediately
- If deleted note was open, editor clears or opens next note

### US-7: Return to My Notes
**As a** returning user, **I want to** open Noti and see my notes immediately, **so that** I don't have to re-select my folder every time.

**Acceptance criteria:**
- Noti remembers the previously selected folder (IndexedDB handle)
- On return, prompts for permission re-grant with a single click
- After permission, notes list loads immediately
- If permission is denied, falls back to folder selection flow

### US-8: External File Changes
**As a** user who also edits files outside the browser (e.g., in Emacs, VS Code, or file manager), **I want** Noti to detect when files are added, removed, or renamed externally, **so that** my notes list stays in sync.

**Acceptance criteria:**
- Directory is re-scanned periodically (every 5-10 seconds)
- New files appear in the list
- Deleted files disappear from the list
- Renamed files update their display
- If the currently-open note is modified externally, show a notification or reload content

---

## Success Criteria for v1

### Functional Completeness
- [ ] All P0 features are implemented and working
- [ ] Core note-taking loop (create, edit, find, delete) takes under 3 actions each
- [ ] Denote filename format is correctly generated and parsed
- [ ] Files created by Noti are valid denote files (interoperable with Emacs denote)
- [ ] Files created by Emacs denote are correctly displayed in Noti

### Performance
- [ ] App loads in under 2 seconds
- [ ] Directory with 1000 notes loads and displays list in under 3 seconds
- [ ] Note opens for editing in under 500ms
- [ ] Auto-save completes in under 200ms
- [ ] No visible jank or lag during normal usage

### Reliability
- [ ] No data loss under any normal usage scenario
- [ ] Graceful handling of permission denial
- [ ] Graceful handling of file conflicts (e.g., file deleted externally while open)
- [ ] Works correctly after browser restart (re-permission flow)

### User Experience
- [ ] A new user can create their first note within 30 seconds of landing on the page
- [ ] The app feels fast and responsive (no loading spinners for common operations)
- [ ] Keyboard-driven workflow is possible for power users
- [ ] The interface is clean, minimal, and focused on writing

### Technical
- [ ] Works in Chrome, Edge, Brave, and Arc (latest versions)
- [ ] Served over HTTPS (or localhost for development)
- [ ] No external service dependencies (fully offline-capable after initial page load)
- [ ] Bundle size under 500KB (fast load, simple app)

---

## Open Questions

1. **File extension default**: Should we default to `.md` only, or let users choose between `.md`, `.txt`, and `.org`?
   - **Recommendation**: Default to `.md` for v1. Add extension choice in v2.

2. **Front matter**: Should we add YAML front matter to files (like denote does in Emacs), or keep files as pure content?
   - **Recommendation**: Add minimal front matter (`title`, `date`, `tags`) to match denote behavior. This helps interoperability and allows richer metadata in the future.

3. **Subdirectory handling**: If the user's folder contains subdirectories, should we ignore them or show them?
   - **Recommendation**: Ignore subdirectories in v1. Show only files in the top-level directory.

4. **Non-denote files**: If the folder contains files that don't match the denote pattern, should we show them?
   - **Recommendation**: Show them in a separate "Other Files" section or with a visual indicator. Don't hide them.

5. **Markdown editor choice**: Which markdown editor component should we use?
   - **Recommendation**: Defer to tech lead. Options include CodeMirror 6, ProseMirror, or a simpler textarea with preview.

6. **Maximum note size**: Should we set a limit?
   - **Recommendation**: No hard limit, but optimize for notes under 100KB. Warn if a file is very large.
