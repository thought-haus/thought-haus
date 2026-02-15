# UX Design Spec: URL Link Editing

## Overview

Add external URL link support to Thought.Haus's TipTap editor. Users need to create
links by pasting URLs, edit link URLs after creation, and manage links (open,
copy, remove). The design must feel native to Thought.Haus's warm, minimal aesthetic and
integrate naturally with the existing NoteLink (`[[noteId]]`) experience.

**Markdown round-trip:** Links serialize as standard Markdown `[text](url)` and
internal note links remain `[[YYYYMMDDTHHMMSS]]`. Both coexist in the same
document.

---

## 1. Link Creation: Three Entry Points

### 1.1 Paste URL Over Selected Text (Primary — Zero-Friction)

**Trigger:** User selects text, then pastes a URL from the clipboard.

**Behavior:**

1. Detect that clipboard content is a URL (starts with `http://`, `https://`, or
   matches a URL-like pattern).
2. Detect that the editor has an active text selection.
3. Instead of replacing the selected text with the URL, wrap the selected text
   as a link with `href` set to the pasted URL.
4. Selection clears; cursor moves to end of the newly-created link.
5. A brief, subtle inline confirmation appears: the link text gets a 300ms
   background flash of `var(--color-accent-subtle)` then fades to normal link
   styling.

**Why this is primary:** This is the Thought.Hauson/Linear pattern that power users
expect. It's the fastest path from "I have a URL in my clipboard" to "I have a
named link in my document." No dialog, no extra clicks.

**Edge case — Paste URL with NO selection:**

- If cursor is at a blank position (no selection), paste the raw URL as visible
  linked text. The URL itself becomes both the display text and the href. Apply
  link mark immediately.
- Show the link popover (Section 3) so the user can immediately edit the display
  text if desired.

### 1.2 Keyboard Shortcut: `Cmd+K` / `Ctrl+K` (Deliberate)

**Trigger:** User presses `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux).

**Behavior depends on context:**

**A) Text is selected, no existing link:**

1. Open the **link input popover** (Section 2) anchored just below the selected
   text.
2. URL field is focused and empty.
3. If clipboard contains a URL, pre-fill the URL field with it (user can clear
   or overwrite).
4. User presses Enter → link is applied to the selected text, popover closes.
5. User presses Escape → popover closes, selection restored, no link created.

**B) Cursor inside an existing link:**

1. Open the **link edit popover** (Section 3) for that link.
2. User can edit the URL, unlink, or open the link.

**C) No selection, cursor in plain text:**

1. Open the **link input popover** (Section 2) at cursor position.
2. Show two fields: "Text" (pre-filled with empty) and "URL".
3. URL field is focused. If clipboard contains a URL, pre-fill it.
4. User fills in both, presses Enter → inline link is inserted at cursor
   position.

### 1.3 Auto-Link Detection on Paste (Convenience)

**Trigger:** User pastes raw text that looks like a URL (no text selection).

**Behavior:**

1. The pasted text is inserted as visible text AND automatically wrapped with a
   link mark pointing to itself.
2. The URL is the display text — e.g., pasting `https://example.com` creates a
   clickable `https://example.com` link.
3. No popover or dialog appears — this is a silent, ambient behavior.

**URL detection regex:** Match strings starting with `https?://` followed by at
least one non-whitespace character. Keep it simple — don't try to validate full
RFC 3986. Let the browser handle edge cases when the user clicks.

```
/^https?:\/\/\S+$/
```

**Not auto-linked:**

- Partial URLs like `example.com` (too many false positives with filenames).
- Text that happens to contain a URL among other words (only full-paste of a URL
  triggers this).

---

## 2. Link Input Popover (Creation)

This appears when the user triggers `Cmd+K` to create a new link.

### 2.1 Anatomy

```
┌─────────────────────────────────────────┐
│  https://                          ↵    │
└─────────────────────────────────────────┘
```

A single-field inline popover. Minimal, fast, no chrome.

**When text is already selected:** Only the URL field is shown. The selected
text becomes the display text.

**When no text is selected:** Two fields stacked:

```
┌─────────────────────────────────────────┐
│  Link text                              │
├─────────────────────────────────────────┤
│  https://                          ↵    │
└─────────────────────────────────────────┘
```

### 2.2 Visual Design

```css
/* Popover container */
.linkPopover {
  position: absolute;
  z-index: 50;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow:
    0 4px 16px rgba(26, 26, 24, 0.08),
    0 1px 4px rgba(26, 26, 24, 0.04);
  padding: 4px;
  min-width: 320px;
  max-width: 400px;
}

/* Input field */
.linkPopover input {
  width: 100%;
  font-family: var(--font-sans);
  font-size: 14px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--color-text);
  outline: none;
}

.linkPopover input::placeholder {
  color: var(--color-text-secondary);
}
```

**Positioning:** The popover is anchored below the selected text (or cursor
position), horizontally centered on the selection. If there's not enough space
below, flip above. Clamp to editor bounds so it never overflows the 720px
content area.

### 2.3 Interaction Details

- **Focus:** URL input is focused immediately on open.
- **Pre-fill from clipboard:** If the clipboard contains a URL when `Cmd+K` is
  pressed, pre-fill the URL field and select all text in it (so the user can
  overwrite or just hit Enter to accept).
- **Enter:** Apply the link, close the popover. If URL field is empty, do
  nothing (don't create a link with no href).
- **Escape:** Close the popover without creating a link. Restore previous
  selection.
- **Click outside:** Same as Escape — dismiss without action.
- **Tab (when two fields):** Move focus from "Link text" to "URL" field.
- **Validation:** None. We don't validate the URL. If the user types `foo`, we
  set `href="foo"`. Markdown allows any href. The browser handles what happens
  on click.

### 2.4 Submitting: The Enter-key Indicator

The `↵` symbol shown in the wireframe above is a subtle affordance: a small
`var(--color-text-secondary)` return arrow (↵) at the right edge of the input,
visible only when the input has content. It hints that Enter submits.

```css
.linkPopover .submitHint {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  font-size: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.linkPopover input:not(:placeholder-shown) ~ .submitHint {
  opacity: 1;
}
```

---

## 3. Link Hover/Click Popover (Viewing & Editing)

This appears when the user interacts with an existing link.

### 3.1 Trigger

- **Click on a link** in the editor: Show the popover immediately. The click
  does NOT follow the link (that would navigate away from the editor). This is
  critical — clicking a link in edit mode should let you edit it, not leave.
- **Cursor enters a link** via keyboard navigation: Show the popover after a
  150ms delay (prevents flicker when arrowing through text).

**Trigger that opens the link externally:**

- `Cmd+Click` (Mac) / `Ctrl+Click` (Windows/Linux) — opens the URL in a new
  browser tab.
- This is the universal convention from VS Code, Thought.Hauson, Obsidian, etc.

### 3.2 Anatomy: Compact Toolbar

```
┌──────────────────────────────────────────────────┐
│  example.com/very-long-path...   ✎  📋  🔗  ✕  │
└──────────────────────────────────────────────────┘
```

From left to right:

1. **URL display** — Truncated URL text, showing domain + path start, ellipsized
   if needed. Monospace font (`var(--font-mono)`), smaller size (12px). Color:
   `var(--color-text-secondary)`.
2. **Edit button** (✎) — Pencil icon. Switches popover to edit mode (Section
   3.3).
3. **Copy button** (📋) — Clipboard icon. Copies the full URL to clipboard.
   Shows a brief "Copied!" tooltip on success.
4. **Open button** (🔗) — External link icon. Opens URL in new tab
   (`window.open(url, '_blank', 'noopener')`).
5. **Unlink button** (✕) — X icon. Removes the link mark but keeps the text.
   Popover closes.

### 3.3 Visual Design

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
  box-shadow:
    0 4px 16px rgba(26, 26, 24, 0.08),
    0 1px 4px rgba(26, 26, 24, 0.04);
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
  transition:
    background 0.12s ease,
    color 0.12s ease;
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

### 3.4 Edit Mode

When the user clicks the edit button (✎), the popover transforms in-place:

```
┌─────────────────────────────────────────────┐
│  https://example.com/full-url        ✓  ✕  │
└─────────────────────────────────────────────┘
```

- URL display becomes an editable input, pre-filled with the current URL, all
  text selected.
- **✓ (Checkmark):** Apply the new URL and close edit mode.
- **✕ (X):** Cancel editing, revert to the view mode.
- **Enter:** Same as clicking ✓.
- **Escape:** Same as clicking ✕.

This keeps the user in context — no modal, no navigation away from the text. The
popover just morphs.

### 3.5 Dismissal

- Click outside the popover → dismiss.
- Press Escape → dismiss.
- Move cursor out of the link text → dismiss after 150ms delay.
- Start typing (not inside the popover input) → dismiss immediately.

---

## 4. Link Appearance in the Editor

External URL links must be visually distinct from NoteLinks but share the same
design language.

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
  transition:
    text-decoration-color 0.15s ease,
    background 0.15s ease;
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

| Property        | NoteLink (`[[id]]`)      | URL Link (`[text](url)`)      |
| --------------- | ------------------------ | ----------------------------- |
| Underline style | Dotted                   | Solid                         |
| Color           | `--color-accent`         | `--color-accent`              |
| Underline color | `--color-link-underline` | `--color-link-underline`      |
| Hover underline | Solid                    | Solid (slightly thicker feel) |
| Click behavior  | Navigate to note         | Show link toolbar popover     |
| Cmd+Click       | N/A (already navigates)  | Open in browser tab           |
| Cursor          | Pointer                  | Pointer                       |

The key visual differentiator is **dotted vs solid underline**. NoteLinks use
dotted underlines to signal "this is an internal, wiki-style reference." URL
links use solid underlines to match the web convention for hyperlinks. This is
subtle but learnable.

---

## 5. Keyboard Shortcuts Summary

| Shortcut                   | Context               | Action                                   |
| -------------------------- | --------------------- | ---------------------------------------- |
| `Cmd+K` / `Ctrl+K`         | Text selected         | Open link input popover                  |
| `Cmd+K` / `Ctrl+K`         | Cursor in link        | Open link edit popover                   |
| `Cmd+K` / `Ctrl+K`         | No selection          | Open link input popover (two-field mode) |
| `Cmd+Click` / `Ctrl+Click` | On a link             | Open URL in new browser tab              |
| `Enter`                    | In link input popover | Apply link and close                     |
| `Escape`                   | In any popover        | Dismiss without action                   |
| Paste (with selection)     | URL in clipboard      | Auto-wrap selection as link              |

---

## 6. Markdown Serialization

Links round-trip as standard Markdown:

- **Editor → Markdown:** `[display text](https://example.com)`
- **Markdown → Editor:** Standard Markdown link syntax parsed by
  `@tiptap/markdown`
- **NoteLinks remain unchanged:** `[[20240322T131856]]` is handled by the
  existing NoteLink extension.

If a link has no display text (pasted as raw URL), it serializes as
`[https://example.com](https://example.com)` or equivalently just the raw URL if
TipTap's Markdown extension handles it.

---

## 7. Edge Cases

### 7.1 Malformed URLs

No validation. If the user types `not-a-url` as the href, we store it. The
browser's `window.open()` will handle (or fail gracefully on) whatever the user
provides. This matches the Markdown philosophy — any string is a valid href.

### 7.2 Very Long URLs

- In the link toolbar popover, truncate to ~220px with ellipsis
  (`text-overflow: ellipsis`).
- In edit mode, the full URL is shown in the input (scrollable).
- The Copy button always copies the full, untruncated URL.

### 7.3 Links Inside Code Blocks

Links inside `code` or `pre` blocks are not interactive — they render as plain
text. This matches Markdown semantics (inline code doesn't support formatting).

### 7.4 Paste Over a Link

If the user selects text that is already a link and pastes a new URL:

- Update the existing link's href to the new URL. Don't create a nested link.
- Keep the existing display text.

### 7.5 Empty Link Text

If the user deletes all text inside a link (backspace through it), the link mark
is removed. An empty link is not allowed to persist.

### 7.6 Link + NoteLink Overlap

A NoteLink (`[[id]]`) is an inline atom node, not a mark. A URL link is a mark.
They cannot overlap or nest — a NoteLink cannot be inside a URL link or vice
versa. No special handling needed; ProseMirror's schema prevents this.

---

## 8. Accessibility

- **Link toolbar buttons** have `aria-label` attributes: "Edit link URL", "Copy
  link URL", "Open link in new tab", "Remove link".
- **Popover** has `role="dialog"` and `aria-label="Edit link"`.
- **Focus trap:** When link input popover is open, Tab cycles through its
  interactive elements. Escape exits.
- **Screen reader announcement:** When a link is created via
  paste-over-selection, announce "Link created" via an `aria-live="polite"`
  region.
- **Keyboard navigation:** All popover buttons are focusable via Tab and
  activatable via Enter/Space.

---

## 9. Animations & Micro-Interactions

### 9.1 Link Creation Flash

When a link is created (via paste-over-selection or Cmd+K), the link text gets a
brief background highlight:

```css
@keyframes linkCreated {
  0% {
    background: var(--color-accent-subtle);
  }
  100% {
    background: transparent;
  }
}

.linkJustCreated {
  animation: linkCreated 400ms ease-out;
}
```

This provides instant visual feedback that something happened — the text is now
a link. It's subtle (a warm, barely-visible wash) and fast.

### 9.2 Popover Enter/Exit

- **Enter:** Fade in + slight upward slide (4px) over 120ms. `ease-out` timing.
- **Exit:** Fade out over 80ms. No slide (faster exit feels snappier).

```css
.linkPopover {
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

### 9.3 Copy Button Feedback

When the user clicks "Copy URL":

1. The clipboard icon briefly morphs into a checkmark (✓).
2. Holds for 1.5s, then returns to clipboard icon.
3. No tooltip needed — the icon change is sufficient feedback.

### 9.4 Unlink Transition

When the user clicks "Unlink":

1. Popover fades out (80ms).
2. The link text's underline fades out over 200ms (transition on
   `text-decoration-color` to transparent).
3. Text color transitions from accent to normal text color over 200ms.

This makes the "unlinking" feel deliberate, not abrupt.

---

## 10. Implementation Notes (for Frontend Engineer)

### 10.1 TipTap Extension

Use `@tiptap/extension-link` as the base. Configure:

```ts
Link.configure({
  openOnClick: false, // We handle click ourselves (show popover, not navigate)
  autolink: false, // We implement our own paste-detection logic
  linkOnPaste: false, // We implement our own paste-over-selection logic
  HTMLAttributes: {
    rel: "noopener noreferrer",
    target: null, // Don't set target in HTML — we handle opening in popover
  },
});
```

### 10.2 Popover Positioning

Use TipTap's `BubbleMenu` extension concept, or implement a lightweight Preact
component that:

1. Listens for editor selection changes.
2. When cursor is inside a link mark, calculates the DOM rect of the link text.
3. Positions a Preact-rendered popover relative to that rect.
4. Handles viewport clamping (don't overflow the editor container).

A custom approach (rather than TipTap's BubbleMenu) gives us more control over:

- Show/hide timing (150ms delay for keyboard navigation).
- Different popover content based on context (creation vs editing).
- Animation control.

### 10.3 Paste Interception

Add a ProseMirror plugin (via `addProseMirrorPlugins()`) that intercepts `paste`
events:

```
handlePaste(view, event):
  1. Read clipboard text.
  2. If text matches URL pattern AND selection is non-empty:
     → Wrap selection in link mark with href = clipboard text.
     → Return true (handled).
  3. If text matches URL pattern AND selection is empty:
     → Insert text with link mark applied.
     → Return true (handled).
  4. Otherwise: return false (let TipTap handle normally).
```

### 10.4 Cmd+K Shortcut

Register via TipTap's `addKeyboardShortcuts()`:

```ts
addKeyboardShortcuts() {
  return {
    'Mod-k': () => {
      // Emit a custom event or update a signal that the popover component listens to
      // The popover component handles the context-dependent logic
      return true;
    },
  };
}
```

### 10.5 Files to Create/Modify

- **New:** `src/editor/extensions/link.ts` — Custom Link extension wrapping
  `@tiptap/extension-link`
- **New:** `src/editor/link-popover.tsx` — Preact component for the link
  creation/edit popover (if using Preact for popover rendering)
- **New:** `src/editor/link-popover.css` — Styles for the popover
- **Modify:** `src/editor/tiptap-editor.ts` — Add Link extension to the
  extensions array
- **Modify:** `src/editor/tiptap-theme.css` — Add/update `a[href]` link styles
- **New dep:** `@tiptap/extension-link` — npm install

---

## 11. What We're NOT Building (Scope Boundaries)

- **Link previews / unfurling:** No fetching page titles or Open Graph data.
  This is a Markdown editor, not Thought.Hauson. Links are text + URL.
- **Link search / autocomplete:** No searching for pages or URLs in the link
  input. Just a plain text field.
- **Drag and drop links:** No special handling for dragging URLs into the editor
  from the browser bar or other apps.
- **Email/tel links:** No special `mailto:` or `tel:` detection. Users can
  manually type these as hrefs.
- **Link analytics or tracking:** No click counting or link health checking.

---

## 12. Dark Mode

All colors use CSS custom properties that are already defined for both light and
dark themes in `src/index.css`. The popover inherits from `--color-bg`,
`--color-border`, `--color-text`, etc. No additional dark mode work is needed
beyond using the existing custom properties.

The box shadow changes in dark mode via the existing `--color-shadow` variable
to use higher-opacity shadows appropriate for dark backgrounds.
