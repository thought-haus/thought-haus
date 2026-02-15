# UX Research: Local-First Note-Taking Patterns for Thought.Haus

## 1. Lessons from Original Evernote (2008-2015)

### What Made It Great

The original Evernote succeeded by focusing relentlessly on a single promise: **"remember everything."** The core interaction loop was dead simple:

1. **Capture** -- A green floating action button was always visible. One tap to create a note. Friction was near-zero.
2. **Organize** -- Notebooks and tags provided two orthogonal axes of organization. Notebooks were containers (one note, one notebook). Tags were cross-cutting labels (one note, many tags).
3. **Find** -- Powerful full-text search, including OCR on images. Users rarely needed to browse; they just searched.
4. **Sync** -- Seamless cross-device sync meant the note you captured on your phone was instantly on your laptop.

### The Hierarchy Model

- **Notebook Stacks** > **Notebooks** > **Notes** gave just enough hierarchy without becoming a deep folder tree.
- The sidebar showed notebooks and tags side by side, making both navigation paradigms equally accessible.
- The note list was a simple chronological or alphabetical list within each notebook.

### Why It Declined

Evernote's decline is a cautionary tale for Thought.Haus:

- **Feature bloat**: Added task management, chat, presentation mode, business features. Each individually reasonable, collectively overwhelming.
- **Lost core identity**: Users couldn't tell if Evernote was a notes app, a task manager, a document scanner, or a collaboration tool.
- **Performance degradation**: More features meant slower startup, slower sync, buggier experience.
- **Lesson for Thought.Haus**: Do one thing exceptionally well. Note-taking is the core loop. Resist the urge to expand scope. If users want a task manager, they'll use a task manager.

---

## 2. Modern Local-First UX Patterns

### Obsidian

**Strengths:**
- Local-first, files-on-disk (plain Markdown). Users own their data completely.
- Bidirectional linking (`[[note name]]`) creates a knowledge graph.
- Graph view provides visual navigation of connected notes.
- Massive plugin ecosystem for extensibility.
- Vim keybindings, custom CSS, community themes -- power user paradise.

**Weaknesses:**
- Steep learning curve. New users face a blank vault with no guidance.
- Plugin dependency for basic features (e.g., daily notes, templates).
- Mobile experience is noticeably weaker than desktop.
- Can feel like configuring a tool rather than using one.

**Takeaway for Thought.Haus:** Obsidian proves local-first Markdown files work. But Thought.Haus should provide a more guided, opinionated experience out of the box rather than requiring configuration.

### Bear

**Strengths:**
- Apple Design Award winner (2017). Beautiful, minimal UI.
- **Tag-based organization is its killer feature:**
  - Tags are created inline by typing `#tagname` anywhere in a note.
  - Nested tags via slash syntax: `#recipes/italian` creates a hierarchy.
  - Tags appear in the sidebar with disclosure triangles for nested children.
  - TagCons (custom icons per tag) provide quick visual identification.
  - Multi-word tags: `#vacation plans#` wraps the phrase.
  - Pinned tags stay at the top of the sidebar for quick access.
- Focus mode strips away all UI chrome for distraction-free writing.
- Markdown-based but with rich text rendering inline (hybrid approach).

**Weaknesses:**
- Apple-only ecosystem.
- No folder/notebook concept -- tags are the only organizational tool.
- Limited export options.

**Takeaway for Thought.Haus:** Bear's inline tag creation (`#tag`) is the gold standard for tag UX. The denote filename scheme already encodes tags, so Thought.Haus should mirror this by making tags a first-class inline interaction. Nested tags with sidebar hierarchy is a proven pattern.

### Apple Notes

**Strengths:**
- Zero-friction capture. Open app, start typing. No decisions required.
- Tight OS integration (share sheet, Siri, widgets, Quick Note).
- Simple folder hierarchy that non-technical users understand immediately.
- Rich text editor that "just works" -- no Markdown knowledge needed.

**Weaknesses:**
- Limited organization (folders only, no tags until recently).
- No cross-platform support.
- Limited export/interop.

**Takeaway for Thought.Haus:** Apple Notes proves that reducing friction at capture time is paramount. The fastest path from "I have a thought" to "it's saved" wins. Thought.Haus should make new note creation a single action.

### Thought.Hauson

**Strengths:**
- Flexible block-based editor supports many content types.
- Database views (table, kanban, calendar, gallery) over the same data.
- Templates reduce friction for repeated note types.

**Weaknesses:**
- Cloud-dependent, not truly local-first.
- Can be overwhelming for simple note-taking.
- Performance issues with large workspaces.

**Takeaway for Thought.Haus:** Thought.Hauson's block editor is powerful but too complex for a notes-first app. Thought.Haus should use a simpler editing model (Markdown with rich rendering) and avoid the "everything is a database" paradigm.

---

## 3. File-System-Backed UX: The Denote Naming Scheme

### How Denote Filenames Work

The denote naming scheme encodes metadata directly in the filename:

```
20240322T131856--my-note-title__tag1_tag2.md
```

Components:
- **Identifier**: `20240322T131856` -- timestamp-based unique ID, ensures sort order and uniqueness
- **Separator**: `--` (double hyphen) separates ID from title
- **Title**: `my-note-title` -- slugified, lowercase, hyphens for spaces
- **Tag separator**: `__` (double underscore) separates title from tags
- **Tags/Keywords**: `tag1_tag2` -- underscore-separated list
- **Extension**: `.md` -- file type

Permutations allowed:
- `20240322T131856.md` (ID + extension only)
- `20240322T131856--my-note-title.md` (no tags)
- `20240322T131856__tag1_tag2.md` (no title)

### UX Challenge: Pretty Title vs. Actual Filename

This is the central UX tension for Thought.Haus. Users will see these files in two places:

1. **In the Thought.Haus UI** -- where we control the presentation
2. **In Finder/Explorer** -- where they see the raw filename

**Recommendation: Embrace the dual nature, don't hide it.**

**In the Thought.Haus UI:**
- Display the **human-readable title** as the primary identifier (e.g., "My Note Title").
- Show tags as styled pills/badges below or beside the title.
- Show the date as a relative or formatted timestamp ("March 22, 2024" or "2 days ago").
- The raw filename should be accessible (e.g., on hover or in a note info panel) but not prominent.

**In the file system:**
- The long filename is actually a **feature**, not a bug. Users can search, sort, and filter notes using basic OS tools (grep, find, ls).
- Thought.Haus should generate filenames automatically from the note's title and tags. Users should never manually type a denote filename.
- When a user changes a title or tags in the UI, Thought.Haus renames the file on disk automatically.

**Rename handling:**
- If a user renames a file outside Thought.Haus (in Finder), Thought.Haus should detect this and parse the new filename to update the displayed title/tags.
- If a user renames within Thought.Haus, the file on disk is renamed to match.
- Conflict resolution: the filename is the source of truth for metadata (title, tags, date). The file content is the source of truth for the note body. Front-matter in the Markdown file can optionally store a "display title" if it differs from the filename slug.

---

## 4. Key Interaction Flows

### 4.1 First-Time Experience (Onboarding)

**Goal:** Get the user from zero to first note in under 30 seconds.

**Flow:**

1. **Landing screen**: Clean, minimal. Brief tagline explaining what Thought.Haus is. A single primary CTA: "Open a Folder" (or "Create a Notebook").
2. **Folder picker**: Browser's native `showDirectoryPicker()` dialog appears. User selects or creates a folder.
   - **If folder has existing `.md` files**: Thought.Haus scans and indexes them. Shows a brief "Found X notes" message. Transition to the main UI with notes populated.
   - **If folder is empty**: Thought.Haus creates a welcome note (e.g., `20240101T000000--welcome-to-noti__getting-started.md`). Transition to the main UI with the welcome note open.
3. **Permission explanation**: Before the picker, a brief inline message explains: "Thought.Haus stores your notes as Markdown files in a folder you choose. Your notes never leave your device."
4. **Handle persistence**: Store the directory handle in IndexedDB so the user doesn't need to re-pick the folder on next visit.
5. **Returning user flow**: On app load, check IndexedDB for a saved handle. Use `queryPermission()` to verify access. If granted, go straight to the main UI. If expired, show a "Re-open Notebook" prompt with the folder name.

**Design principles:**
- No account creation. No sign-up. No cloud. This is a key differentiator -- emphasize it.
- The folder picker is unavoidable (browser security), so make it feel intentional rather than like a hurdle.
- Suggest creating a new folder with a meaningful name (e.g., "My Notes" or "Work Notes").

### 4.2 Creating a New Note

**Goal:** Absolute minimum friction. One action from intent to typing.

**Flow:**
- **Primary**: Keyboard shortcut (Cmd/Ctrl + N) or prominent "+" button in the sidebar/toolbar.
- A new untitled note opens immediately in the editor. The cursor is in the title field (or the first line of the note body).
- The filename is generated automatically when the note is first saved (or after a debounced idle period):
  - Timestamp is captured at creation time.
  - Title is derived from the first heading or first line of content.
  - Tags are added as the user types `#tag` in the note body.
- **No modal dialogs.** No "choose a notebook" step. No "enter title" dialog. Just start typing.

**Auto-save:**
- Notes save automatically on a short debounce (e.g., 500ms after last keystroke).
- The file on disk is always up to date. No explicit "save" action needed.
- Show a subtle save indicator (e.g., a small dot or "Saved" text) that confirms writes completed.

### 4.3 Finding and Navigating Notes

**Goal:** Any note findable in under 3 seconds.

**Three navigation paths (in priority order):**

1. **Search** (Cmd/Ctrl + K or Cmd/Ctrl + F):
   - Global search across all notes -- titles, tags, and full-text body content.
   - Results appear instantly in a command-palette-style overlay (like VS Code's Cmd+P or Obsidian's quick switcher).
   - Results ranked by relevance: exact title match > tag match > body content match.
   - Show a preview snippet of the matching content for body matches.
   - Recent notes appear as suggestions before the user types anything.

2. **Sidebar browsing**:
   - Note list shows all notes, sorted by last modified (default).
   - Filter by tag by clicking a tag in the tag section of the sidebar.
   - Sort options: last modified, created date, title alphabetical.

3. **Tag navigation**:
   - Tags section in the sidebar lists all tags with note counts.
   - Clicking a tag filters the note list to show only notes with that tag.
   - Support multi-tag filtering (intersection: notes with tag A AND tag B).

### 4.4 Editing a Note

**Goal:** Writing should feel as natural as a native text editor. No learning curve.

**Recommended approach: Hybrid Markdown with live rendering (like Typora/Bear).**

- User types Markdown syntax, and it renders inline immediately.
  - `# Heading` becomes a styled heading as soon as the user moves the cursor away.
  - `**bold**` becomes **bold** inline.
  - `- list item` gets proper bullet styling.
  - Code blocks get syntax highlighting.
- When the cursor is on a formatted element, the Markdown syntax is revealed for editing.
- A minimal formatting toolbar provides buttons for common formatting (bold, italic, heading, list, code, link) for users who don't know Markdown syntax.
- No split-pane preview. No mode switching. The editor IS the preview.

**Why this approach:**
- Rich text editors (Google Docs style) lose the Markdown file compatibility that is core to Thought.Haus's value.
- Raw Markdown editors (plain text) have a learning curve and feel technical.
- The hybrid approach preserves Markdown on disk while feeling like a rich text editor. Bear and Typora have proven this model works.

**Editor framework considerations:**
- ProseMirror or TipTap (ProseMirror-based) for a rich hybrid editing experience.
- CodeMirror 6 for a more code-editor-feel with Markdown extensions.
- Milkdown (ProseMirror + remark) is purpose-built for this exact use case.

### 4.5 Organizing with Tags

**Goal:** Tags should be effortless to add and powerful to navigate.

**Tag creation:**
- Inline in the note body: type `#tagname` and it becomes a tag (Bear-style).
- Tags are automatically extracted and added to the filename's `__tag1_tag2` section.
- Autocomplete suggests existing tags as the user types `#`.
- Multi-word tags: `#project-name` (hyphens, matching the denote convention).

**Tag management:**
- Sidebar shows all tags with note counts.
- Nested tags via `/` separator: `#work/meetings` creates a hierarchy.
- Rename a tag: updates all notes that have it (both filename and body content).
- Delete a tag: removes it from all notes (with confirmation).
- Pin frequently used tags to the top of the sidebar.

**Tags in the denote filename:**
- The `__tag1_tag2` portion of the filename is kept in sync with inline tags in the note body.
- If a user adds `#newtag` in the note body, the filename is updated to include `_newtag`.
- The filename tags and body tags are a single source of truth -- they should always match.

### 4.6 Search and Filter

**Goal:** Instant, forgiving, comprehensive.

**Search features:**
- Full-text search across all note content, titles, and tags.
- Fuzzy matching for typos (searching "reciepe" finds notes tagged "recipe").
- Search-as-you-type with instant results.
- Filter modifiers: `tag:recipe` to search only in tagged notes, `title:meeting` to search only titles.
- Recent searches remembered.

**Filter features:**
- Filter by tag (sidebar click or search modifier).
- Filter by date range (created or modified).
- Sort by relevance, date modified, date created, or title.
- Combine filters: tag + date + text search simultaneously.

---

## 5. Layout and Information Architecture

### Recommended Layout: Collapsible Two-Pane with Sidebar

```
+------------------+----------------------------------------+
|                  |                                        |
|    SIDEBAR       |              EDITOR                    |
|                  |                                        |
|  [Search bar]    |  Note Title                            |
|                  |                                        |
|  ALL NOTES (42)  |  #tag1 #tag2           March 22, 2024  |
|  --------------- |  -----------------------------------   |
|  TAGS            |                                        |
|   #work (12)     |  Note body content here...             |
|     /meetings    |                                        |
|     /projects    |  Lorem ipsum dolor sit amet...         |
|   #personal (8)  |                                        |
|   #recipes (5)   |                                        |
|                  |                                        |
|  --------------- |                                        |
|  NOTES           |                                        |
|   Today          |                                        |
|    Meeting notes |                                        |
|    Project plan  |                                        |
|   Yesterday      |                                        |
|    Recipe idea   |                                        |
|                  |                                        |
+------------------+----------------------------------------+
```

### Why Two-Pane (Not Three-Pane)

Three-pane layouts (sidebar + note list + editor, like classic Evernote or Apple Mail) work well for apps with heavy browsing needs. But for a notes-first app:

- **Two-pane reduces cognitive overhead.** The user is either navigating or writing. The sidebar handles navigation; the editor handles writing.
- **Maximizes editor space.** Notes are about writing. Give the editor the most real estate.
- **The sidebar serves double duty.** It shows both the tag hierarchy (for navigation) and the note list (for selection). Clicking a tag filters the note list in-place.
- **Mobile-friendly.** Two-pane collapses naturally to a single pane on mobile (sidebar slides in/out). Three-pane is much harder to adapt.

### Sidebar Structure (Top to Bottom)

1. **Search bar** -- Always visible at the top. Cmd/Ctrl+K focuses it.
2. **All Notes** -- Shows total count. Click to see all notes in the note list below.
3. **Tags section** -- Collapsible. Shows tag hierarchy with counts. Clicking a tag filters the note list.
4. **Note list** -- Shows notes matching the current filter (all notes, or filtered by tag/search). Each note shows: title, first line preview, relative date, tag pills.

### Sidebar Behavior

- **Default width**: 280px. Resizable by dragging the edge.
- **Collapsible**: Toggle with a button or Cmd/Ctrl+\. When collapsed, the editor takes full width (zen mode for writing).
- **Responsive**: On narrow viewports (<768px), sidebar overlays as a slide-out panel.

### Editor Area Structure

1. **Title area** -- Large, prominent. Editable. Changes sync to filename.
2. **Metadata bar** -- Below title. Shows tags (as clickable pills), creation/modified date. Subtle, non-intrusive.
3. **Editor body** -- The main writing area. Full hybrid Markdown editing.
4. **Status bar** -- Bottom of editor. Shows word count, character count, save status. Minimal.

### Design Tokens and Visual Principles

- **Minimal chrome.** Borders, shadows, and decorative elements should be minimal. Let content breathe.
- **High contrast for text.** Note content should be high-contrast and easy to read for long sessions.
- **Muted UI elements.** Sidebar, metadata, and controls should use muted colors that recede behind the content.
- **Dark mode support.** Essential for a notes app. Many users write at night.
- **Monospace option for code-heavy users.** Allow switching between proportional and monospace fonts.

---

## 6. Summary: Core Design Principles for Thought.Haus

1. **Capture is king.** The path from "I have a thought" to "it's written down" must be the shortest possible. One action to create a note, then just type.

2. **Files are the truth.** The local folder of Markdown files IS the notebook. Thought.Haus is a lens on that folder, not a database that happens to export files. If Thought.Haus disappears, the user still has perfectly usable Markdown files with meaningful names.

3. **Tags over folders.** Follow Bear's model. Tags are more flexible than folders (a note can have many tags but only one folder). The denote naming scheme already embeds tags in filenames, making this a natural fit.

4. **Search over browse.** Like original Evernote, make search the primary navigation tool. Browsing via tags is the secondary path. Both should be fast.

5. **Hybrid Markdown editing.** Write in Markdown, see rich rendering inline. No mode switching, no split pane. The file on disk is always clean Markdown.

6. **Transparent file naming.** The denote filename scheme is a feature for power users who also work with their files outside the app. The UI should present pretty titles while keeping the filename accessible.

7. **Resist feature creep.** Learn from Evernote's decline. The app should do notes excellently. No task management, no calendar, no chat, no AI features in v1. Depth over breadth.

8. **No account required.** No sign-up, no cloud, no sync service. This is a local-first app that works with a folder on your computer. This simplicity is a feature, not a limitation.
