# Noti Editor Design Specification

## Design Philosophy

Noti's editor should feel like writing in a beautiful leather journal — warm, quiet, and inviting. The design draws from:

- **Bear**: Polished minimalism, typography-first design, subtle syntax dimming
- **iA Writer**: Focus on content, optimal reading width (~65 chars), markdown chars visible but styled
- **Obsidian Minimal**: Warm color schemes, refined heading hierarchy
- **Typora**: Seamless feel, no visual friction between editing and reading

**Core principle**: Markdown syntax characters should be *visible but subdued* — styled in a lighter tone so they recede while the content itself stays prominent. This is iA Writer's approach ("the right way to do Markdown is to not hide the formatting characters; just style/color them") adapted to Noti's warm palette.

---

## 1. Editor Typography

### Body Text
```
Font:        "Iosevka Aile", var(--font-sans)
Size:        16px (1rem)
Line-height: 1.75
Color:       #1A1A18 (--color-text)
```

**Rationale**: Iosevka Aile is already the app's UI font — using it in the editor creates cohesion (like Bear uses Bear Sans everywhere). At 16px with 1.75 line-height, the text is comfortable for extended writing. The quasi-proportional nature of Iosevka Aile gives it a slight monospace character that suits raw markdown, while remaining more readable than a true monospace font.

### Content Width
```
Max-width: 720px (already ~780px in container, but content should be narrower)
```
At 16px Iosevka Aile, this produces approximately 65-70 characters per line — the typographic sweet spot for comfortable reading (supported by iA Writer's research).

---

## 2. Markdown Syntax Highlighting

### Color Palette for Syntax

All colors are derived from the existing warm palette, extending it with purpose-specific tones:

```css
/* New CSS variables for the editor */
--editor-syntax:         #C4B5A2;  /* Markdown punctuation (##, **, `, etc.) — warm sand */
--editor-heading:        #1A1A18;  /* Heading text — full contrast */
--editor-emphasis:       #1A1A18;  /* Bold/italic text — full contrast */
--editor-link:           #B8621B;  /* Links — accent amber */
--editor-link-url:       #C4B5A2;  /* URL portion of links — subdued */
--editor-code-text:      #8B5E34;  /* Inline code text — warm brown */
--editor-code-bg:        #F3EFE7;  /* Inline code background — warm tint */
--editor-block-bg:       #F6F3ED;  /* Code block background */
--editor-blockquote:     #D4A574;  /* Blockquote bar — muted amber */
--editor-blockquote-text:#5C5850;  /* Blockquote text — slightly muted */
--editor-hr:             #E0D9CC;  /* Horizontal rules */
--editor-list-marker:    #B8621B;  /* List bullets/numbers — accent */
```

### Headings (h1 through h6)

Headings use the same font but vary in size and weight. The `##` markers are rendered in the subdued syntax color.

```
H1:  font-size: 1.625em    font-weight: 600    color: --color-text       letter-spacing: -0.02em
H2:  font-size: 1.375em    font-weight: 600    color: --color-text       letter-spacing: -0.015em
H3:  font-size: 1.125em    font-weight: 600    color: --color-text       letter-spacing: -0.01em
H4:  font-size: 1em        font-weight: 600    color: --color-text
H5:  font-size: 0.9375em   font-weight: 600    color: --color-text-secondary
H6:  font-size: 0.875em    font-weight: 600    color: --color-text-secondary

Heading markers (##):
  color: --editor-syntax (#C4B5A2)
  font-weight: 400 (normal — markers don't need to be bold)
```

**Rationale**: Bear uses 500 weight for headings with a clear size scale. We use 600 to match the app's existing `.title` weight. The hash marks fade to warm sand so the heading text itself pops. H5/H6 go secondary-colored since they're rarely used and should feel quieter.

### Bold & Italic

```
Bold text:      font-weight: 600    color: --color-text (unchanged)
Italic text:    font-style: italic  color: --color-text (unchanged)

Bold/italic markers (** and *):
  color: --editor-syntax (#C4B5A2)
```

The content stays full-contrast; only the asterisks/underscores recede.

### Links

```
Link text [visible part]:
  color: --editor-link (#B8621B)
  text-decoration: underline
  text-decoration-style: dotted
  text-underline-offset: 2px

Link URL portion (url):
  color: --editor-link-url (#C4B5A2)
  font-size: 0.9375em (slightly smaller to reduce noise)

Link brackets/parens:
  color: --editor-syntax (#C4B5A2)
```

Links use the amber accent — consistent with how the sidebar uses accent for selected states. The URL portion fades so the link text stands out.

### Inline Code

```
`code` backticks:
  color: --editor-syntax (#C4B5A2)

code text:
  font-family: var(--font-mono) — "SF Mono", "Fira Code", etc.
  font-size: 0.875em (slightly smaller to compensate for monospace visual weight)
  color: --editor-code-text (#8B5E34)
  background: --editor-code-bg (#F3EFE7)
  padding: 0.125em 0.3em
  border-radius: 4px
```

**Rationale**: The warm brown on warm-tinted background creates a subtle "parchment chip" effect. The 4px radius matches the app's small border-radius scale.

### Code Blocks (Fenced)

```
Background:     --editor-block-bg (#F6F3ED)
Border:         1px solid --color-border (#E9E6DE)
Border-radius:  8px
Padding:        1rem 1.25rem
Margin:         0.75rem 0
Font-family:    var(--font-mono)
Font-size:      0.875em
Line-height:    1.6
Color:          --color-text

Fence markers (```):
  color: --editor-syntax (#C4B5A2)
```

The code block background is slightly darker than the editor background (#F6F3ED vs #FDFCFA), creating a gentle inset without harsh borders. The 8px radius matches the search input and button radius used elsewhere in the app.

### Blockquotes

```
Border-left:    3px solid --editor-blockquote (#D4A574)
Padding-left:   1rem
Color:          --editor-blockquote-text (#5C5850)

> marker:
  color: --editor-syntax (#C4B5A2)
```

The amber-tinted left border creates a warm callout feel. Text is slightly muted to indicate quotation vs. original writing.

### Lists

```
Bullet/number markers:
  color: --editor-list-marker (#B8621B)
  font-weight: 500

List text:
  color: --color-text (unchanged)

Checkbox [ ]:
  color: --editor-syntax (#C4B5A2)

Checkbox [x]:
  color: --editor-list-marker (#B8621B)

Checked item text:
  color: --color-text-secondary (#94918A)
  text-decoration: line-through
  text-decoration-color: #D1CEC6
```

List markers use the accent amber for a pop of warmth. Checked items dim like Bear's approach.

### Horizontal Rules

```
---/*** markers:
  color: --editor-syntax (#C4B5A2)

Rendered line (if using decoration):
  border: none
  border-top: 1px solid --editor-hr (#E0D9CC)
  margin: 1.5rem 0
```

---

## 3. Scrollbar Design

Thin, warm overlay scrollbars that appear on scroll and fade when idle — matching macOS native behavior but with custom colors.

```css
.cm-scroller::-webkit-scrollbar {
  width: 6px;
}

.cm-scroller::-webkit-scrollbar-track {
  background: transparent;
}

.cm-scroller::-webkit-scrollbar-thumb {
  background: rgba(180, 170, 155, 0.35);
  border-radius: 3px;
}

.cm-scroller::-webkit-scrollbar-thumb:hover {
  background: rgba(180, 170, 155, 0.55);
}
```

**Rationale**: Bear uses native macOS scrollbars. Since Noti runs in a browser, we emulate the thin overlay feel with warm-toned translucent scrollbar thumbs. The 6px width is narrow enough to feel unobtrusive but wide enough to be usable.

---

## 4. Active Line & Cursor

### Active Line Highlight

```
Background: #FBF8F2 (very subtle warm tint — just 1 shade darker than --color-bg #FDFCFA)
Border-radius: 0 (full-width highlight, not rounded)
Transition: background 0.15s ease
```

**Rationale**: A barely-there warm highlight tells you where you are without creating visual noise. The transition matches the 0.15s ease used throughout the app. Most premium editors (Bear, iA Writer) use either no highlight or an extremely subtle one.

### Cursor

```
Color:    --color-accent (#B8621B)
Width:    1.5px
```

The amber cursor ties the editing experience to the accent color that appears in the sidebar selection, tag hovers, and button hovers. 1.5px is slightly thicker than the browser default (1px) for better visibility without feeling heavy.

---

## 5. Selection Styling

```
Background:  rgba(184, 98, 27, 0.12)   /* Amber accent at 12% opacity */
Color:       inherit (text stays readable)
```

**Alternative for stronger selection:**
```
Background:  #FEF0E2  /* Warm amber tint, opaque */
```

**Rationale**: The amber-tinted selection creates a warm glow that's consistent with `--color-accent-subtle` (#FEF7F0) used for sidebar selection highlights. At 12% opacity, it's visible enough to see what's selected while keeping text fully readable.

---

## 6. Overall Editor Spacing & Layout

### Header-to-Editor Transition

Currently the header has `border-bottom: 1px solid var(--color-border)` which creates a hard line. The editor body then starts with `padding: 0 3rem`.

**Proposed change:**

```css
.header {
  padding: 2rem 3rem 1.25rem;  /* Slightly more bottom padding */
  border-bottom: none;          /* Remove the hard line */
}

.editorBody {
  padding: 1.25rem 3rem 2rem;  /* Top padding creates breathing room */
  max-width: 720px;            /* Slightly narrower for optimal reading */
}
```

Removing the border between header and editor creates a seamless flow from title -> tags -> content, like writing on a continuous page. The spacing alone provides separation.

### Content Padding (inside CodeMirror)

```css
.cm-content {
  padding: 0;               /* Padding handled by .editorBody container */
  min-height: 300px;         /* Enough space for the editor to feel spacious */
  caret-color: #B8621B;     /* Amber cursor */
}

.cm-line {
  padding: 0.125rem 0;      /* Tiny vertical padding between lines for click target */
}
```

### Editor-to-Status Bar Transition

The status bar already uses `--color-surface` background with a top border. This is fine — it should feel separate from the writing area, like the footer of a page.

### Placeholder Text

```
Color:     --color-text-secondary (#94918A)
Font-style: italic (to differentiate from real content)
```

---

## 7. Note Links (already styled — refinements)

The existing note link theme is close but should be tuned to match:

```css
.cm-note-link {
  color: var(--color-accent);
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
  text-decoration-color: rgba(184, 98, 27, 0.4); /* Subtle underline */
  border-radius: 2px;
  padding: 0 2px;
  transition: text-decoration-color 0.15s ease, background 0.15s ease;
}

.cm-note-link:hover {
  text-decoration-style: solid;
  text-decoration-color: var(--color-accent);
  background: var(--color-accent-subtle);
}
```

---

## 8. Summary of All CSS Variables

Add these to `:root` in `index.css`:

```css
/* Editor-specific palette */
--editor-syntax:         #C4B5A2;
--editor-link-url:       #C4B5A2;
--editor-code-text:      #8B5E34;
--editor-code-bg:        #F3EFE7;
--editor-block-bg:       #F6F3ED;
--editor-blockquote:     #D4A574;
--editor-blockquote-text:#5C5850;
--editor-hr:             #E0D9CC;
--editor-active-line:    #FBF8F2;
--editor-selection:      rgba(184, 98, 27, 0.12);
```

---

## 9. Inspirations Applied

| Feature | Inspiration | Adaptation for Noti |
|---------|------------|-------------------|
| Font cohesion | Bear (Bear Sans everywhere) | Iosevka Aile in both UI and editor |
| Syntax dimming | iA Writer ("style, don't hide") | Warm sand #C4B5A2 for all markdown punctuation |
| Line width | iA Writer (65 chars) | 720px max-width at 16px gives ~65-70 chars |
| Active line | Bear (none/very subtle) | Barely-there #FBF8F2 warm tint |
| Amber cursor | Obsidian warm themes | #B8621B matching the app accent |
| Code block inset | Typora (subtle bg difference) | #F6F3ED block on #FDFCFA editor bg |
| Scrollbar | Bear (native macOS) | Custom thin overlay matching warm palette |
| Selection | Obsidian Minimal warm | Amber 12% opacity selection highlight |
| List markers | Bear (accent-colored bullets) | Amber #B8621B markers |
| Heading scale | Bear (1.9/1.65/1.25) | Adapted to 1.625/1.375/1.125 for tighter feel |
| No border between header/editor | iA Writer (seamless page) | Remove border-bottom, use spacing instead |

---

## 10. What This Does NOT Include

This spec intentionally omits:
- **Focus mode** (dimming non-active paragraphs like iA Writer): Nice future feature, not needed now
- **WYSIWYG rendering** (hiding markdown like Typora): Noti is a source editor; we style, not hide
- **Dark mode**: The palette works for light mode; dark mode would need a separate spec
- **Custom fonts beyond Iosevka Aile**: Keeping it cohesive with one font family
- **Animated transitions on markdown rendering**: Keep it simple and fast

---

## Implementation Notes

1. All markdown syntax highlighting should be implemented via CodeMirror 6's `HighlightStyle` and `syntaxHighlighting` extension, mapping `@lezer/highlight` tags to the colors above.

2. The scrollbar, selection, cursor, and active line styles go in the `EditorView.theme({})` configuration.

3. The spacing changes (header border removal, editorBody padding) are CSS module changes in `editor-view.module.css`.

4. New CSS variables should be added to `:root` in `index.css`.
