# UX Design Spec: URL Link Editing

## Overview

Add the ability to **view and edit URLs on existing links** in Thought.Haus's TipTap editor. Link creation (paste-over-selection, auto-link on paste) already works via TipTap's built-in Link extension. What's missing is a way to **see the URL, edit it, copy it, open it, or remove the link** — all from a popover that appears on click, Linear-style.

**Markdown round-trip:** Links serialize as standard Markdown `[text](url)` and internal note links remain `[[YYYYMMDDTHHMMSS]]`. Both coexist in the same document.

---

## 1. What Already Works (Built-in TipTap)

These behaviors are provided by TipTap's Link extension and require **no custom code**:

- **Paste URL over selected text** → wraps selection as a link (`linkOnPaste: true`)
- **Paste raw URL with no selection** → inserts as clickable linked text (`autolink: true`)
- **Markdown round-trip** → `[text](url)` serialization via `@tiptap/markdown`
- **Inline text editing** → since TipTap is WYSIWYG, the display text of a link is always directly editable by placing the cursor in it and typing

---

## 2. What We're Building: The Link Popover

The core problem: once a link exists, the URL is invisible in WYSIWYG mode. The user can edit the display text by just typing, but they have no way to see or change the underlying `href`. We need a **link popover** (Linear-style) that surfaces the URL and provides link actions.

### 2.1 Trigger: Click on a Link

**Primary trigger:** Clicking a link in the editor shows the popover immediately. The click does **not** open the URL — it shows the popover instead. This requires `openOnClick: false` on the Link extension.

**Opening the link:** The popover provides an explicit "Open" button (and the URL text itself is clickable). This is the Linear pattern — click to manage, explicit action to navigate.

**Keyboard navigation:** When the cursor enters a link via arrow keys, show the popover after a **150ms delay** (prevents flicker when arrowing through text quickly).

### 2.2 Anatomy: Compact Toolbar

```
┌──────────────────────────────────────────────────┐
│  example.com/very-long-path...   ✎  📋  🔗  ✕  │
└──────────────────────────────────────────────────┘
```

From left to right:
1. **URL display** — Truncated URL text, showing domain + path start, ellipsized if needed. Monospace font (`var(--font-mono)`), smaller size (12px). Color: `var(--color-text-secondary)`.
2. **Edit button** (✎) — Pencil icon. Switches popover to URL edit mode (Section 2.4).
3. **Copy button** (📋) — Clipboard icon. Copies the full URL to clipboard. Shows brief checkmark feedback.
4. **Open button** (🔗) — External link icon. Opens URL in new tab (`window.open(url, '_blank', 'noopener')`).
5. **Unlink button** (✕) — X icon. Removes the link mark but keeps the text. Popover closes.

### 2.3 Visual Design

```css
.linkToolbar {
  position: absolute;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(26, 26, 24, 0.08), 0 1px 4px rgba(26, 26, 24, 0.04);
  padding: 4px 6px;
  max-width: 400px;
}

.linkToolbar .urlText {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
  padding: 2px 6px;
}

.linkToolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}

.linkToolbar button:hover {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.linkToolbar button:focus-visible {
  box-shadow: 0 0 0 2px var(--color-focus-ring);
  outline: none;
}
```

### 2.4 URL Edit Mode

When the user clicks the edit button (✎), the popover transforms in-place:

```
┌─────────────────────────────────────────────┐
│  https://example.com/full-url        ✓  ✕  │
└─────────────────────────────────────────────┘
```

- URL display becomes an editable input, pre-filled with the current URL, all text selected.
- **✓ (Checkmark):** Apply the new URL and close edit mode. Returns to view mode.
- **✕ (X):** Cancel editing, revert to the view mode.
- **Enter:** Same as clicking ✓.
- **Escape:** Same as clicking ✕.

This keeps the user in context — no modal, no navigation away from the text. The popover just morphs.

### 2.5 Positioning

The popover is anchored below the link text. If there's not enough space below, flip above. Clamp to editor bounds so it never overflows the 720px content area. Horizontally aligned to the start of the link.

### 2.6 Dismissal

- Click outside the popover → dismiss.
- Press Escape → dismiss (if not in edit mode; in edit mode, Escape cancels the edit first).
- Cursor leaves the link text → dismiss after 150ms delay.
- Start typing in the editor (not inside the popover input) → dismiss immediately.

---

## 3. Keyboard Shortcut Considerations

### 3.1 Cmd+K Stays as Global Search

`Cmd+K` / `Ctrl+K` is already used for **global search** in Thought.Haus. Since clicking a link now shows the popover directly (Linear-style), there's no pressing need for a dedicated "edit link" keyboard shortcut. The popover is always one click away.

`Cmd+K` remains exclusively for global search in all contexts — no conflict to resolve.

### 3.2 Future Consideration

If keyboard-heavy users request a shortcut for link editing, a context-switch approach could work: `Cmd+K` when cursor is inside a link opens the popover, otherwise focuses global search. But this adds complexity and isn't needed for v1.

---

## 4. Link Appearance in the Editor

External URL links must be visually distinct from NoteLinks but share the same design language.

### 4.1 Default State

```css
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
```

### 4.2 Hover State

```css
.tiptap a[href]:hover {
  text-decoration-color: var(--color-accent);
  background: var(--color-accent-subtle);
}
```

### 4.3 Visual Distinction from NoteLinks

| Property | NoteLink (`[[id]]`) | URL Link (`[text](url)`) |
|---|---|---|
| Underline style | Dotted | Solid |
| Color | `--color-accent` | `--color-accent` |
| Underline color | `--color-link-underline` | `--color-link-underline` |
| Hover underline | Solid | Solid (slightly thicker feel) |
| Click behavior | Navigate to note | Show link popover |
| Cursor | Pointer | Pointer |

The key visual differentiator is **dotted vs solid underline**. NoteLinks use dotted underlines to signal "this is an internal, wiki-style reference." URL links use solid underlines to match the web convention for hyperlinks.

---

## 5. Keyboard Shortcuts Summary

| Shortcut | Context | Action |
|---|---|---|
| Click on link | In editor | Show link popover |
| Paste URL over selection | In editor | Wrap selection as link (built-in) |
| Arrow into link text | In editor | Show link popover (150ms delay) |
| `Enter` | In popover URL input | Apply URL change |
| `Escape` | In popover (view mode) | Dismiss popover |
| `Escape` | In popover (edit mode) | Cancel edit, return to view mode |
| `Tab` | In popover | Cycle through buttons |

---

## 6. Markdown Serialization

Links round-trip as standard Markdown:

- **Editor → Markdown:** `[display text](https://example.com)`
- **Markdown → Editor:** Standard Markdown link syntax parsed by `@tiptap/markdown`
- **NoteLinks remain unchanged:** `[[20240322T131856]]` is handled by the existing NoteLink extension.

If a link has no display text (pasted as raw URL), it serializes as `[https://example.com](https://example.com)` or equivalently just the raw URL if TipTap's Markdown extension handles it.

---

## 7. Edge Cases

### 7.1 Malformed URLs

No validation. If the user types `not-a-url` as the href, we store it. The browser's `window.open()` will handle (or fail gracefully on) whatever the user provides. This matches the Markdown philosophy — any string is a valid href.

### 7.2 Very Long URLs

- In the link toolbar popover, truncate to ~220px with ellipsis (`text-overflow: ellipsis`).
- In edit mode, the full URL is shown in the input (scrollable).
- The Copy button always copies the full, untruncated URL.

### 7.3 Links Inside Code Blocks

Links inside `code` or `pre` blocks are not interactive — they render as plain text. This matches Markdown semantics (inline code doesn't support formatting).

### 7.4 Paste URL Over Existing Link

If the user selects text that is already a link and pastes a new URL:
- Update the existing link's href to the new URL. Don't create a nested link.
- Keep the existing display text.
(This is handled by TipTap's built-in `linkOnPaste` behavior.)

### 7.5 Empty Link Text

If the user deletes all text inside a link (backspace through it), the link mark is removed. An empty link is not allowed to persist.

### 7.6 Link + NoteLink Overlap

A NoteLink (`[[id]]`) is an inline atom node, not a mark. A URL link is a mark. They cannot overlap or nest — a NoteLink cannot be inside a URL link or vice versa. No special handling needed; ProseMirror's schema prevents this.

---

## 8. Accessibility

- **Link toolbar buttons** have `aria-label` attributes: "Edit link URL", "Copy link URL", "Open link in new tab", "Remove link".
- **Popover** has `role="toolbar"` and `aria-label="Link actions"`.
- **Keyboard navigation:** All popover buttons are focusable via Tab and activatable via Enter/Space.
- **Focus management:** When popover appears, focus remains in the editor (popover is supplemental). When user clicks edit button, focus moves to the URL input. Escape returns focus to the editor.

---

## 9. Animations & Micro-Interactions

### 9.1 Popover Enter/Exit

- **Enter:** Fade in + slight upward slide (4px) over 120ms. `ease-out` timing.
- **Exit:** Fade out over 80ms. No slide (faster exit feels snappier).

```css
.linkToolbar {
  animation: popoverIn 120ms ease-out;
}

@keyframes popoverIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 9.2 Copy Button Feedback

When the user clicks "Copy URL":
1. The clipboard icon briefly morphs into a checkmark (✓).
2. Holds for 1.5s, then returns to clipboard icon.
3. No tooltip needed — the icon change is sufficient feedback.

### 9.3 Unlink Transition

When the user clicks "Unlink":
1. Popover fades out (80ms).
2. The link text's underline fades out over 200ms (transition on `text-decoration-color` to transparent).
3. Text color transitions from accent to normal text color over 200ms.

This makes the "unlinking" feel deliberate, not abrupt.

---

## 10. Implementation Notes

### 10.1 TipTap Link Extension Configuration

Configure the Link extension with `openOnClick: false` so clicks show our popover instead of navigating:

```ts
Link.configure({
  openOnClick: false,     // We show popover on click, not navigate
  autolink: true,         // Auto-detect URLs as user types
  linkOnPaste: true,      // Paste URL over selection wraps it as link
  HTMLAttributes: {
    rel: 'noopener noreferrer',
  },
  shouldAutoLink: (url) => /^https?:\/\//i.test(url), // Only auto-link full URLs, not bare domains
})
```

### 10.2 Link Edit Extension

A separate TipTap Extension that:
1. Intercepts clicks on links — shows the popover (since `openOnClick: false`)
2. Monitors selection changes — when cursor enters a link via keyboard, show the popover after 150ms
3. Manages the popover lifecycle (create, position, dismiss)

### 10.3 Popover Implementation

Pure DOM popover (not Preact), following the `note-link-suggest.ts` pattern:
- Singleton DOM element managed by the extension
- Two states: view mode (toolbar) and edit mode (URL input)
- Positioned relative to the link element's bounding rect

### 10.4 Files to Create/Modify

- **New:** `src/editor/extensions/link-edit.ts` — Extension for popover orchestration
- **New:** `src/editor/link-popover.ts` — Pure DOM popover (view + edit modes)
- **New:** `src/editor/link-popover.css` — Popover styles
- **Modify:** `src/editor/tiptap-editor.ts` — Add LinkEdit extension, configure Link
- **Modify:** `src/editor/tiptap-theme.css` — Refine `a[href]` link styles

---

## 11. What We're NOT Building (Scope Boundaries)

- **Custom paste handling** — TipTap's built-in `linkOnPaste` and `autolink` handle this
- **Link creation popover / Cmd+K** — Links are created by pasting URLs (built-in). No "create link" dialog. Cmd+K stays as global search.
- **Link previews / unfurling** — No fetching page titles or Open Graph data
- **Link search / autocomplete** — No searching for pages or URLs
- **Drag and drop links** — No special handling for dragging URLs into the editor
- **Email/tel links** — No special `mailto:` or `tel:` detection
- **Link analytics or tracking** — No click counting or link health checking

---

## 12. Dark Mode

All colors use CSS custom properties that are already defined for both light and dark themes in `src/index.css`. The popover inherits from `--color-bg`, `--color-border`, `--color-text`, etc. No additional dark mode work is needed beyond using the existing custom properties.

The box shadow changes in dark mode via the existing `--color-shadow` variable to use higher-opacity shadows appropriate for dark backgrounds.
