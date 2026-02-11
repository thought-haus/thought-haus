# Editor Redesign — Implementation Plan

## Problem

The CodeMirror 6 editor looks out of place: wrong font, no syntax highlighting, ugly dual scrollbars, no active line/cursor/selection styling. It doesn't match the warm "Literary Studio" aesthetic of the rest of the app.

## Summary of Changes

3 files to modify, 0 new dependencies (all features available in existing CM6 packages).

---

## Step 1: Fix scroll architecture + add editor CSS variables

**Files:** `src/index.css`, `src/ui/editor-view.module.css`

### index.css — Add editor-specific variables to `:root`

```css
/* Editor-specific palette */
--editor-syntax:          #C4B5A2;
--editor-code-text:       #8B5E34;
--editor-code-bg:         #F3EFE7;
--editor-block-bg:        #F6F3ED;
--editor-blockquote:      #D4A574;
--editor-blockquote-text: #5C5850;
--editor-hr:              #E0D9CC;
--editor-active-line:     #FBF8F2;
--editor-selection:       rgba(184, 98, 27, 0.12);
```

### editor-view.module.css — Fix layout + scrollbar + header

1. **Fix dual scrollbar**: Change `.editorBody` from `overflow-y: auto` to `overflow: hidden`
2. **Remove header border**: Remove `border-bottom` from `.header`, adjust padding
3. **Add scrollbar styling**: Global `.cm-scroller` thin scrollbar rules
4. **Narrow content width**: `max-width: 720px`

```css
.header {
  padding: 2rem 3rem 1.25rem;
  /* border-bottom: REMOVED */
}

.editorBody {
  flex: 1;
  overflow: hidden;           /* was overflow-y: auto — CRITICAL FIX */
  padding: 0 3rem;
  max-width: 720px;
}
```

Add global scrollbar rules (these are pseudo-elements, can't go in CM6 theme):

```css
.editorBody :global(.cm-scroller) {
  scrollbar-width: thin;
  scrollbar-color: rgba(180, 170, 155, 0.35) transparent;
}
.editorBody :global(.cm-scroller)::-webkit-scrollbar {
  width: 6px;
}
.editorBody :global(.cm-scroller)::-webkit-scrollbar-track {
  background: transparent;
}
.editorBody :global(.cm-scroller)::-webkit-scrollbar-thumb {
  background: rgba(180, 170, 155, 0.35);
  border-radius: 3px;
}
.editorBody :global(.cm-scroller)::-webkit-scrollbar-thumb:hover {
  background: rgba(180, 170, 155, 0.55);
}
```

---

## Step 2: Rewrite the CodeMirror theme + add extensions

**File:** `src/editor/editor.ts`

This is the biggest change. Replace the minimal config with a full premium setup.

### New imports needed (all from existing dependencies)

```ts
import { drawSelection, highlightActiveLine, highlightSpecialChars,
         dropCursor, rectangularSelection, crosshairCursor } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { syntaxHighlighting, bracketMatching, HighlightStyle } from "@codemirror/language"
import { tags } from "@lezer/highlight"
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search"
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete"
```

Note: `@lezer/highlight` and `@codemirror/search` and `@codemirror/autocomplete` are transitive deps of the existing packages. Verify they resolve — if not, `npm install @codemirror/search @codemirror/autocomplete`.

### New theme (replaces existing `EditorView.theme({...})`)

```ts
const notiEditorTheme = EditorView.theme({
  "&": {
    fontSize: "16px",
    fontFamily: '"Iosevka Aile", var(--font-sans)',
    color: "var(--color-text)",
    backgroundColor: "var(--color-bg)",
    height: "100%",
  },
  ".cm-content": {
    padding: "1.25rem 0 2rem",
    lineHeight: "1.75",
    caretColor: "var(--color-accent)",
    fontFamily: '"Iosevka Aile", var(--font-sans)',
    minHeight: "300px",
  },
  "&.cm-focused": {
    outline: "none",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--color-accent)",
    borderLeftWidth: "1.5px",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--editor-selection)",
  },
  ".cm-selectionBackground": {
    backgroundColor: "var(--editor-selection)",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--editor-active-line)",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: '"Iosevka Aile", var(--font-sans)',
  },
  ".cm-line": {
    padding: "0.125rem 4px",
  },
  ".cm-placeholder": {
    color: "var(--color-text-secondary)",
    fontStyle: "italic",
  },
  ".cm-gutters": {
    display: "none",
  },
})
```

### New syntax highlighting (new const, added as extension)

```ts
const notiHighlightStyle = HighlightStyle.define([
  // Headings
  { tag: tags.heading1, fontSize: "1.625em", fontWeight: "600", letterSpacing: "-0.02em" },
  { tag: tags.heading2, fontSize: "1.375em", fontWeight: "600", letterSpacing: "-0.015em" },
  { tag: tags.heading3, fontSize: "1.125em", fontWeight: "600", letterSpacing: "-0.01em" },
  { tag: tags.heading4, fontSize: "1em", fontWeight: "600" },
  { tag: tags.heading5, fontSize: "0.9375em", fontWeight: "600", color: "var(--color-text-secondary)" },
  { tag: tags.heading6, fontSize: "0.875em", fontWeight: "600", color: "var(--color-text-secondary)" },

  // Inline formatting
  { tag: tags.strong, fontWeight: "600" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--color-text-secondary)" },

  // Code
  { tag: tags.monospace, fontFamily: 'var(--font-mono)', fontSize: "0.875em",
    color: "var(--editor-code-text)" },

  // Links
  { tag: tags.link, color: "var(--color-accent)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--editor-syntax)" },

  // Quotes
  { tag: tags.quote, color: "var(--editor-blockquote-text)", fontStyle: "italic" },

  // Lists
  { tag: tags.list, color: "var(--color-accent)" },

  // Markdown meta/punctuation (##, **, `, etc.)
  { tag: tags.meta, color: "var(--editor-syntax)" },
  { tag: tags.processingInstruction, color: "var(--editor-syntax)" },

  // Horizontal rules
  { tag: tags.contentSeparator, color: "var(--editor-hr)" },
])
```

### New extension list (replaces existing array)

```ts
const extensions = [
  // Core
  history(),
  EditorState.allowMultipleSelections.of(true),

  // Visual polish
  drawSelection(),
  highlightActiveLine(),
  highlightSpecialChars(),
  highlightSelectionMatches(),
  dropCursor(),
  rectangularSelection(),
  crosshairCursor(),

  // Bracket/pair handling
  bracketMatching(),
  closeBrackets(),

  // Markdown
  markdown({ base: markdownLanguage, codeLanguages: languages }),

  // Syntax highlighting
  syntaxHighlighting(notiHighlightStyle),

  // Keymaps
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
  ]),

  // Line wrapping
  EditorView.lineWrapping,

  // Placeholder
  placeholder("Start writing..."),

  // Theme
  notiEditorTheme,

  // Note links
  noteLinkPlugin,
  noteLinkTheme,

  // Update listener (existing)
  updateListener,
]
```

---

## Step 3: Update note link theme

**File:** `src/editor/note-links.ts`

Update `noteLinkTheme` to match new design:

```ts
export const noteLinkTheme = EditorView.baseTheme({
  ".cm-note-link": {
    color: "var(--color-accent)",
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationStyle: "dotted",
    textUnderlineOffset: "2px",
    textDecorationColor: "rgba(184, 98, 27, 0.4)",
    borderRadius: "2px",
    padding: "0 2px",
    transition: "text-decoration-color 0.15s ease, background 0.15s ease",
  },
  ".cm-note-link:hover": {
    textDecorationStyle: "solid",
    textDecorationColor: "var(--color-accent)",
    backgroundColor: "var(--color-accent-subtle)",
  },
  ".cm-note-link-dead": {
    color: "var(--color-danger)",
    cursor: "default",
    textDecoration: "line-through",
    opacity: "0.7",
    padding: "0 2px",
  },
})
```

---

## Step 4: Verify transitive dependencies resolve

```bash
# Check if these imports resolve from existing packages:
node -e "require.resolve('@lezer/highlight')"
node -e "require.resolve('@codemirror/search')"
node -e "require.resolve('@codemirror/autocomplete')"

# If any fail, install them:
npm install @codemirror/search @codemirror/autocomplete
```

---

## Implementation Order (most impactful first)

1. **Fix dual scrollbar** (Step 1, CSS only) — immediate UX fix
2. **Add editor theme + extensions** (Step 2) — transforms the editing experience
3. **Add syntax highlighting** (Step 2) — makes markdown beautiful
4. **Update note links** (Step 3) — polish
5. **Verify deps** (Step 4) — if needed

---

## Success Criteria

- [ ] Single scrollbar (CM6 scroller only), thin and warm-colored
- [ ] Iosevka Aile font in editor matching the rest of the UI
- [ ] Amber cursor and selection highlighting
- [ ] Subtle active line highlight
- [ ] Markdown headings are visually sized (h1 biggest, h6 smallest)
- [ ] Markdown punctuation (##, **, `, etc.) faded to warm sand
- [ ] Links in amber accent color
- [ ] Inline code has warm background pill
- [ ] No border between header and editor (seamless page feel)
- [ ] All 197 existing tests pass
