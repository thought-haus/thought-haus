# Implementation Plan: URL Link Editing

## Overview

Add URL link creation, editing, and management to Thought.Haus's TipTap editor per the [UX spec](./url-links-ux-spec.md). This plan covers all code changes needed to go from the current state (StarterKit's Link extension with defaults, no editing UI) to a fully functional link editing experience.

**Current state:** StarterKit includes `@tiptap/extension-link` with default config (`openOnClick: true`, `autolink: true`, `linkOnPaste: true`). Links render as `<a>` tags and auto-detect. No UI for creating, editing, or managing links. Clicking a link opens it in a new tab.

**Target state:** Links are editable via Cmd+K, paste-over-selection, and a popover toolbar. Clicking a link shows a popover with edit/copy/open/unlink actions. Markdown round-trips as `[text](url)`.

---

## Architecture Decision: Pure DOM Popover

The link popover will be implemented as **pure DOM manipulation** from within a TipTap extension, following the existing `note-link-suggest.ts` pattern. Rationale:

- **Consistency** — `note-link-suggest` already establishes this pattern for editor-internal popups
- **No bridging needed** — No Preact/signal communication layer between ProseMirror and the UI
- **Lifecycle simplicity** — Popover lifecycle is managed by the extension that owns it, not by the component tree
- **Positioning** — Fixed positioning relative to viewport, same as note-link-suggest

The popover has three modes managed as a simple state machine:
```
create → (submit) → done
view → (click edit) → edit → (submit/cancel) → view
view → (click unlink) → done
```

---

## Files Overview

### New files
| File | Purpose |
|------|---------|
| `src/editor/extensions/link-edit.ts` | TipTap extension: paste handler, Cmd+K, click handler, popover orchestration |
| `src/editor/link-popover.ts` | Pure DOM popover: create/view/edit modes, positioning, keyboard handling |
| `src/editor/link-popover.css` | Popover styles, animations |
| `src/editor/link-popover.test.ts` | Tests for popover logic (URL detection, state machine) |
| `src/editor/extensions/link-edit.test.ts` | Tests for paste handler and URL detection |

### Modified files
| File | Changes |
|------|---------|
| `src/editor/tiptap-editor.ts` | Reconfigure StarterKit link, add LinkEdit extension |
| `src/editor/tiptap-theme.css` | Refine `a[href]` link styling (solid underline vs NoteLink's dotted) |
| `package.json` | Add `@tiptap/extension-link` as explicit dependency |

---

## Phase 1: Link Extension Configuration

### 1.1 Add explicit dependency

```bash
npm install @tiptap/extension-link@^3.19.0
```

Even though it's already a transitive dep of StarterKit, making it explicit ensures it stays available if StarterKit's internals change and lets us import it directly.

### 1.2 Reconfigure `tiptap-editor.ts`

**Key change:** Disable Link from StarterKit, add it separately with our configuration, and add the new LinkEdit extension.

```ts
// src/editor/tiptap-editor.ts
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Link } from "@tiptap/extension-link";
import { Markdown } from "@tiptap/markdown";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { NoteLink } from "./extensions/note-link.ts";
import { LinkEdit } from "./extensions/link-edit.ts";
import "./tiptap-theme.css";

export interface EditorConfig {
  parent: HTMLElement;
  content: string;
  onChange: (text: string) => void;
}

export function createEditor({ parent, content, onChange }: EditorConfig): Editor {
  return new Editor({
    element: parent,
    content,
    contentType: "markdown",
    extensions: [
      StarterKit.configure({
        link: false, // Disable built-in Link — we configure it ourselves
      }),
      Link.configure({
        openOnClick: false,      // We show popover on click, not navigate
        autolink: true,          // Auto-detect URLs as user types
        linkOnPaste: false,      // We handle paste ourselves in LinkEdit
        shouldAutoLink: (url) => /^https?:\/\//i.test(url), // Only auto-link full URLs
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: null,          // Don't set target — we handle opening in popover
        },
      }),
      Markdown,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Typography,
      NoteLink,
      LinkEdit,
    ],
    onUpdate({ editor }) {
      onChange(editor.getText());
    },
  });
}
```

**Why disable Link in StarterKit and re-add separately:**
- StarterKit.configure({ link: { ... } }) would also work, but importing Link directly gives us type-safe access to `LinkOptions` and makes the dependency explicit.
- The `shouldAutoLink` option ensures `autolink` and `addPasteRules()` only match URLs with explicit `http://` or `https://` protocols (matching the UX spec's requirement to not auto-link bare domains like `example.com`).

**Markdown round-trip:** No changes needed. The Link extension already has `markdownTokenName: "link"`, `parseMarkdown`, and `renderMarkdown` that serialize as `[text](url)`. The `@tiptap/markdown` extension handles this automatically.

---

## Phase 2: LinkEdit Extension (`src/editor/extensions/link-edit.ts`)

This is the core extension that wires up all link-editing behaviors. It's a TipTap `Extension` (not a Node or Mark — the Link mark already exists).

### 2.1 Structure

```ts
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { showLinkPopover, hideLinkPopover, PopoverMode } from "../link-popover.ts";
import "../link-popover.css";

const URL_RE = /^https?:\/\/\S+$/;

export const LinkEdit = Extension.create({
  name: "linkEdit",

  addKeyboardShortcuts() { ... },
  addProseMirrorPlugins() { ... },
});
```

### 2.2 Keyboard Shortcut: `Cmd+K`

```ts
addKeyboardShortcuts() {
  return {
    "Mod-k": () => {
      const { editor } = this;
      const { state } = editor;
      const { selection } = state;
      const { from, to, empty } = selection;

      // Case B: Cursor inside an existing link → show view/edit popover
      if (editor.isActive("link")) {
        const linkAttrs = editor.getAttributes("link");
        const linkDom = getLinkDomAtCursor(editor);
        if (linkDom) {
          showLinkPopover({
            mode: "view",
            href: linkAttrs.href,
            anchorEl: linkDom,
            editor,
          });
        }
        return true;
      }

      // Case A: Text selected → show create popover (single URL field)
      // Case C: No selection → show create popover (two fields: text + URL)
      const coords = editor.view.coordsAtPos(from);
      showLinkPopover({
        mode: "create",
        hasSelection: !empty,
        anchorCoords: coords,
        selectionRect: !empty ? getSelectionRect(editor) : null,
        editor,
      });
      return true;
    },
  };
},
```

### 2.3 Paste Handler

A ProseMirror plugin that intercepts paste events:

```ts
addProseMirrorPlugins() {
  const editor = this.editor;
  return [
    new Plugin({
      key: new PluginKey("linkEditPaste"),
      props: {
        handlePaste(view, event) {
          const clipboardText = event.clipboardData?.getData("text/plain")?.trim();
          if (!clipboardText || !URL_RE.test(clipboardText)) {
            return false; // Not a URL — let default handling proceed
          }

          const { state } = view;
          const { selection } = state;

          if (!selection.empty) {
            // Case 1: Text selected + URL pasted → wrap selection as link
            editor.chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: clipboardText })
              .run();

            // Flash animation on the newly linked text
            flashLinkCreated(editor);
            return true;
          }

          // Case 2: No selection + URL pasted → insert as linked text
          // Let the built-in addPasteRules handle this (via shouldAutoLink)
          // OR handle explicitly:
          editor.chain()
            .focus()
            .insertContent({
              type: "text",
              text: clipboardText,
              marks: [{ type: "link", attrs: { href: clipboardText } }],
            })
            .run();
          return true;
        },
      },
    }),

    // Click handler plugin
    new Plugin({
      key: new PluginKey("linkEditClick"),
      props: {
        handleClick(view, pos, event) {
          // Find if click was on a link
          const linkEl = (event.target as HTMLElement)?.closest?.("a");
          if (!linkEl) return false;

          // Check it's within our editor
          if (!view.dom.contains(linkEl)) return false;

          // Cmd/Ctrl+Click → open in new tab
          if (event.metaKey || event.ctrlKey) {
            const href = linkEl.getAttribute("href");
            if (href) window.open(href, "_blank", "noopener");
            return true;
          }

          // Regular click → show view popover (prevent default navigation)
          const attrs = getAttrsAtPos(view.state, pos, "link");
          if (attrs?.href) {
            event.preventDefault();
            showLinkPopover({
              mode: "view",
              href: attrs.href,
              anchorEl: linkEl,
              editor,
            });
            return true;
          }
          return false;
        },
      },
    }),
  ];
},
```

### 2.4 Helper Functions

```ts
/** Get the DOM element for the link mark at current cursor position. */
function getLinkDomAtCursor(editor: Editor): HTMLElement | null {
  const { view, state } = editor;
  const { from } = state.selection;
  const domAtPos = view.domAtPos(from);
  const node = domAtPos.node;
  const el = node instanceof HTMLElement ? node : node.parentElement;
  return el?.closest("a") ?? null;
}

/** Get a DOMRect for the current text selection. */
function getSelectionRect(editor: Editor): DOMRect | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  return sel.getRangeAt(0).getBoundingClientRect();
}

/** Flash animation on newly created link. */
function flashLinkCreated(editor: Editor): void {
  // After a microtask (to let TipTap update the DOM), find the link element
  // and add the flash class
  requestAnimationFrame(() => {
    const linkEl = getLinkDomAtCursor(editor);
    if (linkEl) {
      linkEl.classList.add("link-just-created");
      linkEl.addEventListener("animationend", () => {
        linkEl.classList.remove("link-just-created");
      }, { once: true });
    }
  });
}

/** Get mark attributes at a given position. */
function getAttrsAtPos(
  state: EditorState,
  pos: number,
  markName: string,
): Record<string, string> | null {
  const resolved = state.doc.resolve(pos);
  const marks = resolved.marks();
  const mark = marks.find((m) => m.type.name === markName);
  return mark ? (mark.attrs as Record<string, string>) : null;
}
```

---

## Phase 3: Link Popover (`src/editor/link-popover.ts`)

### 3.1 Module Structure

The popover module exports show/hide functions and manages a singleton DOM element, following the note-link-suggest pattern.

```ts
// src/editor/link-popover.ts
import type { Editor } from "@tiptap/core";

interface PopoverCreateConfig {
  mode: "create";
  hasSelection: boolean;
  anchorCoords: { left: number; top: number; bottom: number };
  selectionRect: DOMRect | null;
  editor: Editor;
}

interface PopoverViewConfig {
  mode: "view";
  href: string;
  anchorEl: HTMLElement;
  editor: Editor;
}

type PopoverConfig = PopoverCreateConfig | PopoverViewConfig;

let popover: HTMLDivElement | null = null;
let currentConfig: PopoverConfig | null = null;
let editMode = false;

export function showLinkPopover(config: PopoverConfig): void { ... }
export function hideLinkPopover(): void { ... }
```

### 3.2 Create Mode

When `showLinkPopover` is called with `mode: "create"`:

1. Create a `<div class="link-popover">` with animation class
2. If `hasSelection`: render single URL input field
3. If `!hasSelection`: render two fields (link text + URL)
4. Attempt to pre-fill URL from clipboard (`navigator.clipboard.readText()`)
5. Position below the selection/cursor
6. Focus the URL input
7. Handle Enter (apply link), Escape (dismiss), click-outside (dismiss)

```ts
function buildCreatePopover(config: PopoverCreateConfig): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "link-popover";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Insert link");

  if (!config.hasSelection) {
    // Two-field mode: text + URL
    const textInput = createInput("Link text", "linkTextInput");
    el.appendChild(textInput);

    const divider = document.createElement("div");
    divider.className = "link-popover-divider";
    el.appendChild(divider);
  }

  const urlWrapper = document.createElement("div");
  urlWrapper.className = "link-popover-url-row";

  const urlInput = createInput("https://", "linkUrlInput");
  urlWrapper.appendChild(urlInput);

  const submitHint = document.createElement("span");
  submitHint.className = "link-popover-submit-hint";
  submitHint.textContent = "↵";
  urlWrapper.appendChild(submitHint);

  el.appendChild(urlWrapper);

  // Pre-fill from clipboard
  tryReadClipboardUrl().then((url) => {
    if (url && urlInput instanceof HTMLInputElement) {
      urlInput.value = url;
      urlInput.select();
    }
  });

  // Key handlers
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitCreatePopover(config, el);
    } else if (e.key === "Escape") {
      e.preventDefault();
      hideLinkPopover();
      config.editor.commands.focus();
    }
  });

  return el;
}
```

### 3.3 View Mode (Link Toolbar)

When `showLinkPopover` is called with `mode: "view"`:

1. Create toolbar: `[truncated URL] [edit] [copy] [open] [unlink]`
2. Position below the link element
3. Handle keyboard navigation (Tab between buttons)
4. Handle Escape to dismiss

```ts
function buildViewPopover(config: PopoverViewConfig): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "link-toolbar";
  el.setAttribute("role", "toolbar");
  el.setAttribute("aria-label", "Link actions");

  // Truncated URL display
  const urlText = document.createElement("span");
  urlText.className = "link-toolbar-url";
  urlText.textContent = truncateUrl(config.href, 35);
  urlText.title = config.href;
  el.appendChild(urlText);

  // Action buttons
  el.appendChild(createToolbarButton("edit", "Edit link URL", "✎", () => {
    switchToEditMode(config);
  }));

  el.appendChild(createToolbarButton("copy", "Copy link URL", copyIcon(), () => {
    navigator.clipboard.writeText(config.href);
    showCopyFeedback(el);
  }));

  el.appendChild(createToolbarButton("open", "Open link in new tab", "↗", () => {
    window.open(config.href, "_blank", "noopener");
  }));

  el.appendChild(createToolbarButton("unlink", "Remove link", "✕", () => {
    config.editor.chain().focus().extendMarkRange("link").unsetLink().run();
    hideLinkPopover();
  }));

  // Escape to dismiss
  el.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideLinkPopover();
      config.editor.commands.focus();
    }
  });

  return el;
}
```

### 3.4 Edit Mode (In-Place Transform)

When user clicks the edit button in view mode, the popover transforms:

```ts
function switchToEditMode(config: PopoverViewConfig): void {
  if (!popover) return;
  editMode = true;

  popover.innerHTML = "";
  popover.className = "link-toolbar link-toolbar-editing";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "link-toolbar-edit-input";
  urlInput.value = config.href;
  urlInput.setAttribute("aria-label", "Link URL");
  popover.appendChild(urlInput);

  popover.appendChild(createToolbarButton("confirm", "Apply URL", "✓", () => {
    applyUrlEdit(config, urlInput.value);
  }));

  popover.appendChild(createToolbarButton("cancel", "Cancel editing", "✕", () => {
    editMode = false;
    // Rebuild view mode
    rebuildAsViewMode(config);
  }));

  urlInput.focus();
  urlInput.select();

  urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyUrlEdit(config, urlInput.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      editMode = false;
      rebuildAsViewMode(config);
    }
  });
}

function applyUrlEdit(config: PopoverViewConfig, newHref: string): void {
  const trimmed = newHref.trim();
  if (!trimmed) return;

  config.editor.chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: trimmed })
    .run();

  editMode = false;
  config.href = trimmed;
  rebuildAsViewMode(config);
}
```

### 3.5 Positioning

Follow the note-link-suggest pattern — fixed positioning relative to an anchor element or coordinates:

```ts
function positionPopover(
  popover: HTMLDivElement,
  anchor: HTMLElement | { left: number; top: number; bottom: number },
): void {
  const rect = anchor instanceof HTMLElement
    ? anchor.getBoundingClientRect()
    : { left: anchor.left, top: anchor.top, bottom: anchor.bottom,
        right: anchor.left, width: 0, height: anchor.bottom - anchor.top };

  const popoverHeight = popover.offsetHeight || 40;
  const popoverWidth = popover.offsetWidth || 320;
  const spaceBelow = window.innerHeight - rect.bottom;
  const above = spaceBelow < popoverHeight + 8 && rect.top > popoverHeight + 8;

  popover.style.position = "fixed";
  popover.style.left = `${Math.min(
    Math.max(rect.left, 8),
    window.innerWidth - popoverWidth - 8
  )}px`;
  popover.style.top = above
    ? `${rect.top - popoverHeight - 4}px`
    : `${rect.bottom + 4}px`;
}
```

### 3.6 Dismissal

The popover dismisses on:
- Click outside (document-level click listener)
- Escape key (handled in each mode)
- Typing in the editor (not in popover input)
- Cursor leaving the link text (selection change)

```ts
function setupDismissListeners(): void {
  // Click outside
  const handleClickOutside = (e: MouseEvent) => {
    if (popover && !popover.contains(e.target as Node)) {
      hideLinkPopover();
    }
  };
  // Use mousedown to dismiss before click events fire
  document.addEventListener("mousedown", handleClickOutside);

  // Store cleanup reference
  cleanupFns.push(() => document.removeEventListener("mousedown", handleClickOutside));
}
```

### 3.7 Clipboard Pre-Fill

```ts
async function tryReadClipboardUrl(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText();
    return URL_RE.test(text.trim()) ? text.trim() : null;
  } catch {
    return null; // Clipboard permission denied — fail silently
  }
}

const URL_RE = /^https?:\/\/\S+$/;
```

---

## Phase 4: CSS (`src/editor/link-popover.css` + `tiptap-theme.css` updates)

### 4.1 Link Popover Styles (`src/editor/link-popover.css`)

This file contains all popover-specific styles. Full CSS is provided in the UX spec sections 2.2, 2.4, 3.3. Key additions:

```css
/* === Create Popover === */
.link-popover {
  position: fixed;
  z-index: 1000;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(26, 26, 24, 0.08), 0 1px 4px rgba(26, 26, 24, 0.04);
  padding: 4px;
  min-width: 320px;
  max-width: 400px;
  animation: popoverIn 120ms ease-out;
}

.link-popover input { /* URL/text input */ }
.link-popover-divider { /* Separator line between two fields */ }
.link-popover-submit-hint { /* The ↵ indicator */ }
.link-popover-url-row { /* Wrapper for input + submit hint */ }

/* === View Toolbar === */
.link-toolbar {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(26, 26, 24, 0.08), 0 1px 4px rgba(26, 26, 24, 0.04);
  padding: 4px 6px;
  max-width: 400px;
  animation: popoverIn 120ms ease-out;
}

.link-toolbar-url { /* Truncated URL text */ }
.link-toolbar button { /* Action buttons: 28x28px */ }
.link-toolbar button:hover { /* Accent hover */ }
.link-toolbar-edit-input { /* URL edit input in edit mode */ }

/* === Animations === */
@keyframes popoverIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes linkCreated {
  0% { background: var(--color-accent-subtle); }
  100% { background: transparent; }
}
```

### 4.2 Link Styling Updates (`src/editor/tiptap-theme.css`)

The existing `.tiptap a` styles need refinement to distinguish URL links from NoteLinks:

```css
/* URL links — solid underline (existing rule, updated) */
.tiptap a[href] {
  color: var(--color-accent);
  text-decoration: underline;
  text-decoration-color: var(--color-link-underline);
  text-underline-offset: 2px;
  cursor: pointer;
  border-radius: 2px;
  padding: 0 1px;
  transition: text-decoration-color 0.15s ease, background 0.15s ease;
}

.tiptap a[href]:hover {
  text-decoration-color: var(--color-accent);
  background: var(--color-accent-subtle);
}

/* Link creation flash */
.tiptap a.link-just-created {
  animation: linkCreated 400ms ease-out;
}
```

Note: NoteLinks already use `text-decoration-style: dotted` (in `.note-link`). URL links use solid underline (default). This provides the visual distinction described in the UX spec.

---

## Phase 5: Testing

### 5.1 URL Detection Tests (`src/editor/extensions/link-edit.test.ts`)

```ts
describe("URL detection", () => {
  it("matches http URLs", () => { ... });
  it("matches https URLs", () => { ... });
  it("rejects bare domains like example.com", () => { ... });
  it("rejects partial text with embedded URLs", () => { ... });
  it("matches URLs with paths, query params, fragments", () => { ... });
});
```

### 5.2 Popover Logic Tests (`src/editor/link-popover.test.ts`)

```ts
describe("truncateUrl", () => {
  it("truncates long URLs with ellipsis", () => { ... });
  it("leaves short URLs unchanged", () => { ... });
  it("strips protocol for display", () => { ... });
});

describe("link popover", () => {
  it("creates a DOM element with correct structure in create mode", () => { ... });
  it("creates toolbar with action buttons in view mode", () => { ... });
  it("positions below anchor element", () => { ... });
  it("flips above when not enough space below", () => { ... });
  it("dismisses on Escape key", () => { ... });
  it("dismisses on click outside", () => { ... });
});
```

### 5.3 Integration Considerations

- TipTap editor tests would need a full editor instance, which is complex to set up in jsdom. Focus unit tests on the extracted helper functions (URL detection, truncation, positioning math).
- The popover DOM tests can use jsdom directly (no editor needed).
- Manual testing checklist:
  - [ ] Cmd+K with text selected → create popover (single field)
  - [ ] Cmd+K with no selection → create popover (two fields)
  - [ ] Cmd+K on existing link → view popover
  - [ ] Paste URL over selected text → link created with flash
  - [ ] Paste URL with no selection → auto-linked text
  - [ ] Click on link → view popover
  - [ ] Cmd+Click on link → opens in new tab
  - [ ] Edit button → edit mode → Enter → URL updated
  - [ ] Copy button → URL copied to clipboard
  - [ ] Open button → URL opens in new tab
  - [ ] Unlink button → link mark removed, text preserved
  - [ ] Escape/click outside → popover dismissed
  - [ ] Links round-trip through Markdown (save → reload → same content)
  - [ ] NoteLinks and URL links coexist in same document
  - [ ] Dark mode renders correctly

---

## Implementation Order

### Step 1: Foundation (link extension config)
1. `npm install @tiptap/extension-link@^3.19.0`
2. Modify `src/editor/tiptap-editor.ts` — reconfigure StarterKit + Link
3. Verify links still render and autolink works
4. Verify markdown round-trip: `[text](url)` → editor → `[text](url)`

### Step 2: Popover infrastructure
1. Create `src/editor/link-popover.css` with all styles
2. Create `src/editor/link-popover.ts` with show/hide, positioning, dismissal
3. Implement **view mode** first (simplest: shows URL + buttons)
4. Wire up a temporary test: manually call `showLinkPopover` to verify positioning

### Step 3: Click handler + view popover
1. Create `src/editor/extensions/link-edit.ts` with the click handler plugin
2. Click on link → show view popover
3. Cmd+Click → open in new tab
4. Test: unlink button, open button, copy button

### Step 4: Edit mode
1. Add edit mode to `link-popover.ts` (in-place transform)
2. Wire up edit button in view toolbar
3. Test: edit URL → confirm → URL updated

### Step 5: Cmd+K + create popover
1. Add keyboard shortcut to `link-edit.ts`
2. Implement create mode in `link-popover.ts`
3. Handle both cases: text selected (single field) and no selection (two fields)
4. Clipboard pre-fill

### Step 6: Paste handler
1. Add paste handler plugin to `link-edit.ts`
2. Paste URL over selection → wrap as link + flash animation
3. Paste URL without selection → insert as linked text

### Step 7: Polish & edge cases
1. Add link creation flash animation CSS
2. Copy button feedback (icon swap)
3. Keyboard navigation within popover (Tab between buttons)
4. Cursor-exits-link dismissal (selection change monitoring)
5. Accessibility: `role`, `aria-label`, focus management

### Step 8: Tests
1. Write URL detection unit tests
2. Write popover DOM structure tests
3. Write positioning/truncation tests

### Step 9: Theme refinement
1. Update `tiptap-theme.css` with refined `a[href]` styles
2. Verify visual distinction from NoteLinks (solid vs dotted underline)
3. Test in dark mode

---

## Edge Cases (from UX spec)

| Case | Handling |
|------|----------|
| Malformed URLs | No validation — any string is a valid href |
| Very long URLs | Truncate to ~220px with ellipsis in view mode; full URL in edit input (scrollable) |
| Links in code blocks | Not interactive — plain text (ProseMirror schema prevents marks in code) |
| Paste URL over existing link | Update href, keep display text |
| Empty link text (all text deleted) | Link mark auto-removed by ProseMirror (marks can't exist on empty text) |
| NoteLink + URL link overlap | Impossible — NoteLink is an atom Node, Link is a Mark. Schema prevents overlap. |
| Popover open + window resize | Reposition on resize event or dismiss |
| Multiple rapid Cmd+K presses | Idempotent — dismiss existing popover before showing new one |

---

## What We're NOT Building

Per the UX spec scope boundaries:
- No link previews/unfurling
- No link search/autocomplete in the URL input
- No drag-and-drop link support
- No special `mailto:`/`tel:` detection
- No link analytics

---

## Dependencies

| Package | Version | Status |
|---------|---------|--------|
| `@tiptap/extension-link` | `^3.19.0` | Already installed (transitive), needs explicit dep |
| `@tiptap/core` | `^3.19.0` | Already installed |
| `@tiptap/pm` | `^3.19.0` | Already installed |

No new external dependencies beyond making `@tiptap/extension-link` explicit.
