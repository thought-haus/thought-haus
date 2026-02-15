# River Panel — Technical Design Spec

## Overview

River is a right-side panel containing multiple stacked TipTap editor instances, each editing a different note. Users add notes to the River via Shift+Click from the sidebar, favorites, or note-link widgets. The panel lives alongside (or replaces) the current AI Assistant panel in the right panel slot.

This document covers the component architecture, editor lifecycle, conflict resolution, persistence, performance strategy, and integration points grounded in the actual Thought.Haus codebase.

---

## 1. Component Architecture

### 1.1 Reusable NoteEditor Component

The current `EditorView` (`src/ui/editor-view.tsx`) is tightly coupled to global signals (`selectedNoteId`, `saveStatus`, `wordCount`) and assumes a single editor instance. We need to extract a reusable `NoteEditor` that receives its note ID as a prop and manages its own lifecycle.

**Proposed `NoteEditor` interface:**

```tsx
interface NoteEditorProps {
  noteId: string;
  compact?: boolean;        // River uses compact mode (smaller header, no status bar)
  readOnly?: boolean;       // For conflict resolution
  onClose?: () => void;     // River close button
  onRequestFocus?: () => void;
}
```

**What moves into NoteEditor:**
- TipTap editor creation/destruction (`createEditor` call)
- Content loading from `StorageBackend`
- Debounced save logic (each instance gets its own debounce timer)
- Title editing and `renameNote` call
- Tag add/remove
- Attachment handling (`handleFiles`)
- Per-editor save status and word count (local `signal()` or `useState`)

**What stays in EditorView:**
- `EditorView` becomes a thin wrapper: `<NoteEditor noteId={selectedNoteId.value} />` with the full-width header layout
- The global `saveStatus`/`wordCount` signals in `editor-state.ts` continue to be set by the main editor for the status bar display

**Key extraction challenge:** The current `EditorView` uses `useRef` to hold a single editor instance and refs for body/noteId. `NoteEditor` must be designed so that each instance is fully independent — no shared mutable state. Each `NoteEditor` holds its own:
- `editorInstanceRef: useRef<Editor | null>`
- `bodyRef: useRef<string>`
- `debouncedSave: useRef<DebouncedFn>`

### 1.2 RiverPanel Component Tree

```
<RiverPanel>
  <RiverHeader />                    — "River" title, close button, clear-all
  <RiverNoteList>                    — Scrollable container
    <RiverNoteCard noteId="...">     — Collapsible card wrapper
      <NoteEditor                    — Reusable editor
        noteId="..."
        compact={true}
        onClose={removeFromRiver}
      />
    </RiverNoteCard>
    ...
  </RiverNoteList>
</RiverPanel>
```

**`RiverNoteCard`** wraps each `NoteEditor` in a collapsible card with:
- A compact header: note title (read-only display), collapse toggle, close (X) button
- A drag handle for reordering (mirrors favorites DnD pattern from `NavFavoriteItem`)
- The `NoteEditor` body (hidden when collapsed)

### 1.3 State Management

New signals in a dedicated `src/river/river-state.ts`:

```ts
/** Ordered list of note IDs currently in the River panel. */
export const riverNoteIds = signal<string[]>([]);

/** Whether the River panel is open. */
export const riverPanelOpen = signal(false);

/** Per-editor collapsed state (Map<noteId, boolean>). */
export const riverCollapsed = signal<Map<string, boolean>>(new Map());
```

Mutations through plain functions:
- `addToRiver(noteId: string)` — prepend to list (or no-op if already present)
- `removeFromRiver(noteId: string)` — remove from list, destroy editor
- `moveInRiver(fromIndex, toIndex)` — reorder
- `clearRiver()` — remove all
- `toggleRiverCollapsed(noteId)` — collapse/expand a card

### 1.4 Right Panel Refactor

The current `Layout` (`src/ui/layout.tsx`) hardcodes the agent panel:

```tsx
{agentPanelOpen.value && (
  <>
    <div class={styles.resizeHandle} ... />
    <div style={{ width: `${agentPanelWidth.value}px` }}>
      <AgentPanel />
    </div>
  </>
)}
```

**Proposed refactor** — Replace with a generic `RightPanel` that uses an icon tab bar:

```tsx
<RightPanel>
  <RightPanelTabBar>
    <TabIcon icon={<Waves />} panel="river" />     — River tab
    <TabIcon icon={<Bot />} panel="agent" />        — AI tab
  </RightPanelTabBar>
  <RightPanelContent>
    {activeRightPanel === "river" && <RiverPanel />}
    {activeRightPanel === "agent" && <AgentPanel />}
  </RightPanelContent>
</RightPanel>
```

New signal in `app-state.ts`:
```ts
export type RightPanelType = "river" | "agent" | null;
export const activeRightPanel = signal<RightPanelType>(null);
```

This replaces `agentPanelOpen` (which becomes `activeRightPanel.value === "agent"`). The icon tab bar sits at the left edge of the right panel, vertically. Clicking a tab toggles it — clicking the active tab closes the panel entirely.

The existing `agentPanelWidth` signal is reused as `rightPanelWidth` since it's the same resize mechanism.

**Migration path:** The refactor is backward-compatible. `AgentPanel` is untouched — it just gets a new parent wrapper. The keyboard shortcut `Cmd+Shift+A` sets `activeRightPanel.value = activeRightPanel.value === "agent" ? null : "agent"`.

---

## 2. Multiple TipTap Instances

### 2.1 Current Editor Factory

`src/editor/tiptap-editor.ts` exports `createEditor()` which instantiates a TipTap `Editor` with these extensions:

- **StarterKit** (history, bold, italic, headings, lists, code blocks, etc.)
- **Markdown** (markdown serialization/deserialization)
- **Link** (autolink, link-on-paste)
- **AttachmentImage** (local path → objectURL resolution)
- **AttachmentCard** (non-image file attachment cards)
- **FileDrop** (paste/drop file handling)
- **TaskList + TaskItem** (checkbox lists)
- **Placeholder** ("Start writing...")
- **Typography** (smart quotes, dashes)
- **NoteLink** (`[[id]]` inline node with suggestion popup)
- **LinkEdit** (click-to-edit link popover)

Each extension is stateless or uses per-instance ProseMirror plugins, so multiple simultaneous `createEditor()` calls should work correctly with one exception: **global DOM singletons**.

### 2.2 Global DOM Concerns

Two extensions create DOM elements appended to `document.body`:

1. **`link-popover.ts`** — Singleton `popover` variable. Only one link popover can be open at a time. This is actually fine for River — clicking a link in any editor should dismiss the previous popover. The popover already positions itself relative to the anchor element, so it works across editor instances.

2. **`note-link-suggest.ts`** — Suggestion popup also appended to `document.body`. The TipTap `Suggestion` plugin creates this per-editor-instance and destroys it when the suggestion closes. Multiple editors won't conflict because only the focused editor triggers suggestions. This works correctly.

**Verdict:** No changes needed to extensions for multi-instance support.

### 2.3 TipTap v3 Performance Profile

Based on research (see [TipTap Discussion #1478](https://github.com/ueberdosis/tiptap/discussions/1478) and [ProseMirror stress tests](https://emergence-engineering.com/blog/lexical-prosemirror-comparison)):

- **Per-instance memory:** ~6-18 MB JSHeapUsedSize (ProseMirror layer). TipTap adds extension overhead on top.
- **30 empty editors with StarterKit:** ~8+ seconds initial render (reported by community).
- **TipTap v3 improvements:** `shouldRerenderOnTransaction: false` by default, new `mount()`/`unmount()` API for reuse.
- **Our stack:** Preact (not React) — no React node views, no framework adapter overhead. All custom node views use vanilla DOM (`addNodeView` returning `{ dom }`). This is significantly cheaper than React node views.

**Realistic assessment for Thought.Haus:**
- With Preact + vanilla node views, each editor is lighter than typical React TipTap setups
- 5 editors: perfectly fine, no special optimization needed
- 10 editors: noticeable memory use (~100-180 MB for editors alone), but workable
- 20 editors: likely too heavy; needs lazy mounting

### 2.4 Extension Configuration for River Editors

River editors can use a lighter extension set:

```ts
export function createRiverEditor(config: EditorConfig): Editor {
  return createEditor({
    ...config,
    // Same extensions — all are needed for faithful note rendering
  });
}
```

No extensions should be removed because every extension affects markdown parsing/rendering fidelity. A note with task lists, attachments, or note-links must render correctly in both main and River editors.

However, we can configure some extensions differently:
- **Placeholder:** Change to empty string (River cards have their own title headers)
- **FileDrop:** Optional — could disable in River for simplicity (v1)

---

## 3. Same-Note Conflict Resolution

### 3.1 The Problem

If note `20240322T131856` is selected in the main editor AND added to the River, two TipTap instances edit the same underlying file. Both have independent ProseMirror documents. Both have debounced auto-save (1.5s). Changes in one editor aren't visible in the other. Saves overwrite each other.

### 3.2 Options Evaluated

| Approach | Complexity | UX Quality | Risk |
|----------|-----------|------------|------|
| **A. Last-write-wins** | Low | Poor — silent data loss | High |
| **B. Read-only in River when open in main** | Low | Decent — clear but limiting | Low |
| **C. Shared ProseMirror state** | Very High — needs Y.js | Excellent — real-time sync | High |
| **D. Detect + prompt** | Medium | Confusing — interrupts flow | Medium |
| **E. Close main when opened in River** | Low | Clean — one source of truth | Low |

### 3.3 Recommendation: Option B — Read-Only Detection

**When a note is open in the main editor (`selectedNoteId.value === noteId`), the River editor for that note becomes read-only.**

Implementation:
```tsx
// In RiverNoteCard
const isOpenInMain = selectedNoteId.value === noteId;

<NoteEditor
  noteId={noteId}
  compact={true}
  readOnly={isOpenInMain}
  onClose={() => removeFromRiver(noteId)}
/>
```

In `NoteEditor`:
```ts
if (readOnly) {
  editor.setEditable(false);
}
// React to readOnly changes:
useEffect(() => {
  editorInstanceRef.current?.setEditable(!readOnly);
}, [readOnly]);
```

**Visual indicator:** A subtle banner at the top of the River card: "Editing in main view" with a small link/button to jump to the main editor. The card is still useful for reference/reading.

**When the user navigates away from the note in the main editor**, the River editor becomes editable again. This transition requires reloading content from disk (in case the main editor changed it):

```ts
useEffect(() => {
  if (!readOnly && wasReadOnly) {
    reloadContentFromDisk();
  }
}, [readOnly]);
```

**Why not Option C (shared state)?** Y.js collaboration is experimental in TipTap, marked as "not supported or maintained" for the multi-field collaborative editing pattern. It adds a massive dependency (Y.js), fundamentally changes the document model, and is overkill for a local-first single-user app. The complexity/benefit ratio is extremely unfavorable.

**Why not Option E (close main)?** It breaks user mental model — clicking a River note shouldn't change what's in the main editor.

### 3.4 File Watcher Interaction

The existing polling watcher (`src/storage/file-watcher.ts`) calls `poll()` every 7 seconds. When it detects a "modified" change, it calls `applyChanges()` which calls `upsertNote()` (updating the store) and `updateInIndex()`.

**For River editors:** When the watcher detects a change to a note that's open in a River editor (but NOT currently being edited by that River editor), the River editor should reload:

- If River editor `saveStatus` is `"saved"` or `"idle"` → safe to reload
- If River editor `saveStatus` is `"unsaved"` → don't reload (user is actively typing)

This can be implemented by subscribing to `notesMap` changes:

```ts
useEffect(() => {
  const note = notesMap.value.get(noteId);
  if (note && note.lastModified > lastKnownModified && localSaveStatus === "saved") {
    reloadContentFromDisk();
    lastKnownModified = note.lastModified;
  }
}, [notesMap.value]);
```

---

## 4. Save System

### 4.1 Per-Editor Save State

The current global signals must be replaced with per-instance state inside `NoteEditor`:

```ts
// Inside NoteEditor component
const [localSaveStatus, setLocalSaveStatus] = useState<SaveStatus>("idle");
const [localWordCount, setLocalWordCount] = useState(0);
```

The main `EditorView` wrapper additionally mirrors its `NoteEditor`'s status to the global signals for the status bar:

```ts
// EditorView (main editor only)
useEffect(() => {
  saveStatus.value = localSaveStatus;
  wordCount.value = localWordCount;
}, [localSaveStatus, localWordCount]);
```

River editors do NOT write to global signals. Their save status is shown per-card (a small indicator in the card header).

### 4.2 Save Handler

Each `NoteEditor` instance creates its own:

```ts
const debouncedSave = useRef(debounce(() => saveNote(), 1500));
```

The `saveNote()` function is identical to the current implementation but uses local state:

```ts
const saveNote = useCallback(async () => {
  const note = getNote(noteId);
  if (!note) return;

  const editor = editorInstanceRef.current;
  if (!editor) return;

  const markdown = editor.getMarkdown();
  setLocalSaveStatus("saving");

  try {
    const backend = storageBackend.value;
    if (!backend) { setLocalSaveStatus("unsaved"); return; }

    const content = serializeFrontMatter(
      { title: note.title, date: note.createdAt.toISOString().replace("Z", ""), tags: note.tags },
      markdown,
    );
    const meta = await backend.write(note.filename, content);
    upsertNote({ ...note, lastModified: meta.lastModified, size: meta.size });
    updateInIndex({ id: note.id, title: note.title, tags: note.tags, body: markdown });
    setLocalSaveStatus("saved");
  } catch {
    setLocalSaveStatus("unsaved");
  }
}, [noteId]);
```

### 4.3 Save Coordination Between Instances

When a River editor saves, it writes the full file (frontmatter + body). The main editor does the same. They never write to the same file simultaneously because:

1. Only one can be editable at a time (Section 3: read-only detection).
2. The debounce timer ensures saves don't overlap within a single instance.

This means there's no save coordination needed beyond the read-only flag.

### 4.4 Window Blur / Beforeunload

The current `EditorView` saves on `window.blur` and `beforeunload`. With multiple editors, each `NoteEditor` should register its own handlers:

```ts
useEffect(() => {
  const handleBlur = () => {
    if (localSaveStatus === "unsaved") {
      debouncedSave.current.cancel();
      saveNote();
    }
  };
  window.addEventListener("blur", handleBlur);
  return () => window.removeEventListener("blur", handleBlur);
}, [saveNote, localSaveStatus]);
```

**Concern:** N editors means N blur handlers. For `beforeunload`, this is fine — the handlers are fast (synchronous kick-off). For `blur`, same — each editor checks its own status and fires if needed.

---

## 5. Persistence

### 5.1 File Schema: `.thoughthouse/river.json`

Following the pattern established by `favorite-persistence.ts`:

```ts
interface RiverFileSchema {
  version: 1;
  notes: RiverNoteEntry[];
}

interface RiverNoteEntry {
  noteId: string;
  collapsed: boolean;
}
```

**What to store:**
- `noteId` — which notes are in the River
- `collapsed` — whether each card is collapsed
- Order is implicit in array position

**What NOT to store (v1):**
- Scroll positions (fragile, not worth the complexity)
- Editor cursor positions (would need ProseMirror state serialization)
- Unsaved content (too complex for v1; content lives on disk)

### 5.2 Load/Save Lifecycle

```ts
// src/river/river-persistence.ts

const APP_DIR = ".thoughthouse";
const RIVER_FILE = "river.json";

export async function loadRiver(backend: StorageBackend): Promise<void> {
  try {
    const raw = await backend.readFromDir(APP_DIR, RIVER_FILE);
    const data: RiverFileSchema = JSON.parse(raw);
    if (data.version === 1 && Array.isArray(data.notes)) {
      riverNoteIds.value = data.notes.map(n => n.noteId);
      const collapsed = new Map<string, boolean>();
      for (const entry of data.notes) {
        if (entry.collapsed) collapsed.set(entry.noteId, true);
      }
      riverCollapsed.value = collapsed;
    }
  } catch {
    riverNoteIds.value = [];
    riverCollapsed.value = new Map();
  }
}

export async function saveRiver(backend: StorageBackend): Promise<void> {
  const map = notesMap.value;
  const validIds = riverNoteIds.value.filter(id => map.has(id));

  if (validIds.length !== riverNoteIds.value.length) {
    riverNoteIds.value = validIds;
  }

  const data: RiverFileSchema = {
    version: 1,
    notes: validIds.map(noteId => ({
      noteId,
      collapsed: riverCollapsed.value.get(noteId) ?? false,
    })),
  };
  await backend.writeToDir(APP_DIR, RIVER_FILE, JSON.stringify(data, null, 2));
}
```

### 5.3 Integration with App Initialization

In `src/ui/app.tsx`, `loadRiver(backend)` is called after `loadFavorites(backend)` during initialization. However, **River editors should NOT be mounted on app load** — only the note IDs and collapsed state are restored. Editors are created lazily when the River panel is opened.

Persistence is triggered on a debounced write (300ms, same pattern as favorites):

```ts
const persistRiver = debounce(() => {
  const backend = storageBackend.value;
  if (backend) saveRiver(backend).catch(() => {});
}, 300);
```

Called from `addToRiver`, `removeFromRiver`, `moveInRiver`, `clearRiver`, `toggleRiverCollapsed`.

---

## 6. Performance Strategy

### 6.1 Baseline Costs

With Thought.Haus's stack (Preact, vanilla DOM node views, no React adapter), each TipTap instance is lighter than typical setups. Estimated per-instance overhead:

| Resource | Estimate | Notes |
|----------|----------|-------|
| JS Heap | 4-12 MB | Lower than React setups due to vanilla node views |
| DOM Nodes | 100-500 per editor | Depends on note content |
| ProseMirror plugins | ~15 per editor | StarterKit + custom extensions |
| Event listeners | ~10 per editor | Input, keydown, paste, drop, etc. |

### 6.2 Strategy by Scale

**1-5 River notes (common case):** Mount all editors eagerly. No optimization needed. This is the expected usage pattern — a handful of reference notes pinned alongside the main editor.

**6-10 River notes:** Still mount all. Monitor total memory but expect it to be under 200 MB total app footprint which is acceptable for a desktop browser app.

**10+ River notes:** Apply lazy mounting:

```ts
// In RiverNoteCard
const [hasBeenVisible, setHasBeenVisible] = useState(false);
const cardRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (collapsed) return; // Don't observe collapsed cards

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setHasBeenVisible(true);
      observer.disconnect();
    }
  }, { rootMargin: "200px" }); // Pre-mount 200px before visible

  if (cardRef.current) observer.observe(cardRef.current);
  return () => observer.disconnect();
}, [collapsed]);

return (
  <div ref={cardRef}>
    {hasBeenVisible && !collapsed ? (
      <NoteEditor noteId={noteId} compact readOnly={isOpenInMain} />
    ) : (
      <div class={styles.placeholder}>
        {collapsed ? null : <LoadingPlaceholder />}
      </div>
    )}
  </div>
);
```

**Collapsed cards:** Never mount the editor. Show only the title header. Editor is created on expand, destroyed on collapse. This is the biggest performance win — most River notes will be collapsed for reference.

### 6.3 Editor Destruction on Collapse

When a user collapses a River card, the TipTap instance should be destroyed to free memory:

```ts
useEffect(() => {
  if (collapsed && editorInstanceRef.current) {
    // Save if unsaved before destroying
    if (localSaveStatus === "unsaved") {
      saveNote(); // fire-and-forget
    }
    editorInstanceRef.current.destroy();
    editorInstanceRef.current = null;
  }
}, [collapsed]);
```

When expanded again, the editor is recreated from disk content. This adds a brief loading moment but dramatically reduces memory usage for large River lists.

### 6.4 TipTap v3 mount/unmount

TipTap v3 introduced `editor.unmount()` and `editor.mount(element)` which preserve editor state while detaching from the DOM. This is an alternative to destroy/recreate for collapse, but it still holds the ProseMirror document in memory. For River, destroy/recreate is preferred because the content is always available from disk and memory savings are more important than preserving cursor position.

---

## 7. Right Panel Refactor

### 7.1 Current Structure

```
Layout
├── NavSidebar (220px fixed)
├── NotesList (resizable, sidebarWidth signal)
├── ResizeHandle
├── EditorPane (flex: 1)
├── ResizeHandle (conditional)
└── AgentPanel (conditional, agentPanelWidth signal)
```

### 7.2 Proposed Structure

```
Layout
├── NavSidebar (220px fixed)
├── NotesList (resizable)
├── ResizeHandle
├── EditorPane (flex: 1)
├── ResizeHandle (conditional)
└── RightPanel (conditional, rightPanelWidth signal)
    ├── RightPanelTabBar (32px vertical strip)
    │   ├── RiverTab (Waves icon)
    │   └── AgentTab (Bot icon)
    └── RightPanelContent (flex: 1)
        ├── RiverPanel (if active)
        └── AgentPanel (if active)
```

### 7.3 Signal Changes

```ts
// New in app-state.ts
export type RightPanelType = "river" | "agent";
export const activeRightPanel = signal<RightPanelType | null>(null);

// Replaces agentPanelOpen
// agentPanelOpen.value → activeRightPanel.value === "agent"
// agentPanelOpen.value = true → activeRightPanel.value = "agent"
// agentPanelOpen.value = false → activeRightPanel.value = null

// Rename for clarity
export const rightPanelWidth = signal(DEFAULT_AGENT_PANEL_WIDTH);
```

### 7.4 Keyboard Shortcuts

```ts
// Existing
Cmd+Shift+A → toggle agent panel
// New
Cmd+Shift+R → toggle River panel

// Implementation
if (key === "a") {
  activeRightPanel.value = activeRightPanel.value === "agent" ? null : "agent";
}
if (key === "r") {
  activeRightPanel.value = activeRightPanel.value === "river" ? null : "river";
}
```

### 7.5 NavSidebar Bot Button

The `NavSidebar` footer currently has a Bot button that toggles `agentPanelOpen`. This should be updated to toggle `activeRightPanel`:

```tsx
<button onClick={() => {
  activeRightPanel.value = activeRightPanel.value === "agent" ? null : "agent";
}}>
  <Bot size={14} />
  <span>AI</span>
</button>
```

---

## 8. Shift+Click Integration

### 8.1 Touch Points

Three locations need Shift+Click handling to add notes to River:

1. **NotesList items** (`src/ui/sidebar.tsx` → `NoteItem`)
2. **NavSidebar favorites** (`src/ui/nav-sidebar.tsx` → `NavFavoriteItem`)
3. **TipTap note-link widgets** (`src/editor/extensions/note-link.ts` → `addNodeView`)

### 8.2 NoteItem (NotesList)

```tsx
// src/ui/sidebar.tsx
function NoteItem({ note, isSelected, onSelect }: NoteItemProps) {
  return (
    <button
      class={`${styles.noteItem} ${isSelected ? styles.noteItemSelected : ""}`}
      onClick={(e) => {
        if (e.shiftKey) {
          addToRiver(note.id);
          // Optionally open River panel if not already open
          if (activeRightPanel.value !== "river") {
            activeRightPanel.value = "river";
          }
        } else {
          onSelect(note.id);
        }
      }}
    >
      ...
    </button>
  );
}
```

### 8.3 NavFavoriteItem

```tsx
// src/ui/nav-sidebar.tsx
onClick={(e) => {
  if (e.shiftKey) {
    addToRiver(note.id);
    if (activeRightPanel.value !== "river") {
      activeRightPanel.value = "river";
    }
  } else {
    onSelect(note.id);
  }
}}
```

**Note:** The drag-and-drop handlers on `NavFavoriteItem` use `onDragStart`, which doesn't conflict with Shift+Click.

### 8.4 TipTap Note-Link Widget

In `src/editor/extensions/note-link.ts`, the `addNodeView()` creates a DOM span with a click handler:

```ts
const navigate = (e: Event) => {
  e.preventDefault();
  if (exists) {
    selectedNoteId.value = noteId;
  }
};
```

Modified to support Shift+Click:

```ts
const navigate = (e: Event) => {
  e.preventDefault();
  if (!exists) return;

  if ((e as MouseEvent).shiftKey) {
    addToRiver(noteId);
    if (activeRightPanel.value !== "river") {
      activeRightPanel.value = "river";
    }
  } else {
    selectedNoteId.value = noteId;
  }
};
```

This requires importing `addToRiver` and `activeRightPanel` into the note-link extension. Since the extension already imports from `../../lib/app-state.ts`, this is consistent with existing patterns.

### 8.5 Visual Feedback

When Shift is held, cursor should change to indicate "add to River" mode. This can be done with CSS:

```css
/* When shift is held, show a different cursor on clickable note items */
body.shift-held .noteItem,
body.shift-held .favoriteItem,
body.shift-held .note-link {
  cursor: crosshair; /* or custom cursor */
}
```

A global keydown/keyup listener toggles `document.body.classList`:

```ts
window.addEventListener("keydown", (e) => {
  if (e.key === "Shift") document.body.classList.add("shift-held");
});
window.addEventListener("keyup", (e) => {
  if (e.key === "Shift") document.body.classList.remove("shift-held");
});
```

---

## 9. Risk Assessment

### 9.1 High Risk

**NoteEditor extraction from EditorView.** The current `EditorView` is ~375 lines with deeply intertwined state management. Extracting `NoteEditor` while keeping the main editor working identically is the riskiest refactor. The save logic, title editing, and tag management all reference global signals that need to become local state.

**Recommendation:** Prototype `NoteEditor` extraction first, before any River UI work. Run existing app with `EditorView` using the new `NoteEditor` component and verify nothing regresses.

### 9.2 Medium Risk

**Multiple editor memory.** While our Preact + vanilla DOM node views setup is lighter than React, 10+ editors with complex notes (images, code blocks) could still consume significant memory. The lazy mounting / collapse-destroy strategy mitigates this, but it hasn't been proven at scale in this codebase.

**Recommendation:** Build a quick prototype with 10 editors on screen and measure actual heap size with Chrome DevTools.

**File watcher interaction.** The 7-second poll + `applyChanges` wasn't designed for multiple open editors. When the watcher detects a change, it updates `notesMap` — but it doesn't notify individual editors to reload content. Each River editor needs to watch `notesMap` for changes to its note, which is additional reactive overhead.

### 9.3 Low Risk

**Right panel refactor.** This is a structural change to `Layout` but doesn't touch complex logic. The `AgentPanel` continues to work exactly as before — it just gets a different parent wrapper.

**Shift+Click integration.** Three simple click handler modifications. Very low risk.

**Persistence (river.json).** Directly follows the `favorites.json` pattern. Low risk.

**Read-only conflict resolution.** `editor.setEditable(false)` is a well-supported TipTap API. The only edge case is the transition from read-only → editable (needs content reload), which is a straightforward async operation.

### 9.4 Prototype Priority

1. **NoteEditor extraction** — Must work before anything else
2. **Two editors on screen** — Mount main + one River editor, verify saves don't conflict
3. **10-editor memory test** — Validate performance assumptions
4. **Right panel shell** — Tab bar + River panel container
5. **Full River UI** — Cards, collapse, drag-to-reorder, persistence

---

## 10. Implementation Order (Suggested Phases)

### Phase 1: Foundation
- Extract `NoteEditor` from `EditorView`
- `EditorView` becomes thin wrapper around `NoteEditor`
- Verify all existing functionality works

### Phase 2: Right Panel
- Create `RightPanel` with tab bar
- Move `AgentPanel` into `RightPanel`
- Add `activeRightPanel` signal, update keyboard shortcuts
- River tab shows empty state placeholder

### Phase 3: River Core
- `river-state.ts` (signals + mutation functions)
- `river-persistence.ts` (load/save to `.thoughthouse/river.json`)
- `RiverPanel` component with `RiverNoteCard` wrappers
- Mount `NoteEditor` instances in River cards
- Read-only detection for same-note conflict

### Phase 4: Integration
- Shift+Click in NotesList, NavSidebar favorites, note-link widgets
- Drag-to-reorder in River
- Collapse/expand with editor destroy/create
- File watcher integration for River editors

### Phase 5: Polish
- Lazy mounting for 10+ editors (IntersectionObserver)
- Visual feedback for Shift key
- River empty state design
- Performance profiling and optimization
