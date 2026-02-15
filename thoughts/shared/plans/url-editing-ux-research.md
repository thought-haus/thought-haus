# URL Editing UX Research: Competitive Analysis

## Editors Analyzed

### Thought.Hauson
- **Cmd+K** opens a link input popover anchored to selected text
- **Paste URL over selection** auto-wraps selected text as a link (the gold-standard pattern)
- **Paste raw URL** shows a context menu: "Paste as mention", "Paste as preview", or raw paste
- **Link popover on click**: Shows URL + actions (edit, remove, copy, open)
- **Edit mode**: Popover transforms in-place to an editable URL input
- Uses inline popovers, never full modals

### Google Docs
- **Ctrl+K** opens a dialog with "Text" and "Link" fields
- Suggests related headings and bookmarks in the link field
- **Link popover**: Appears on click with truncated URL, edit/remove/copy/open buttons
- More dialog-heavy than Thought.Hauson — feels slightly heavier
- No paste-over-selection auto-linking

### Obsidian
- **Ctrl+K** inserts markdown link syntax `[](cursor-here)` — raw markdown editing
- **Ctrl+Click** follows external links in browser
- No popover — you edit the raw markdown directly
- Plugin ecosystem adds richer link UX (Quick Links, etc.)
- WikiLinks (`[[note]]`) for internal links

### Bear (macOS)
- Hybrid live editor showing both markdown syntax and formatted output
- **Formatting bar** provides link insertion without memorizing markdown
- WikiLinks for internal note connections
- Link dialog can search for headers/blocks as targets
- Clean, minimal approach matching their design philosophy

### Apple Notes
- **Cmd+K** on Mac to create links from selected text
- Auto-link detection when typing/pasting URLs
- **Control-click** a link for edit/remove/open context menu
- Simple but effective — no popover, uses native context menu
- iPhone lacks Cmd+K — links added on Mac appear on iOS but can't be created there

### Typora
- WYSIWYG markdown editor — renders in-place as you type
- **Cmd+K / Ctrl+K** inserts link; if clipboard has URL, pre-fills it
- Clicking near formatted text reveals underlying markdown syntax
- Real-time rendering without split-pane preview
- Seamless transition between editing and viewing states

### Linear
- TipTap-based editor (same underlying technology as Thought.Haus)
- **Paste URL over selection** auto-wraps as link
- **Floating bubble menu** appears on text selection for formatting
- **Link-specific bubble** appears when cursor is inside a link
- Known for extremely polished micro-interactions and fast feel

## Universal Patterns Identified

### Keyboard Shortcuts
- **Cmd+K / Ctrl+K** is the universal "insert/edit link" shortcut across ALL editors
- **Cmd+Click / Ctrl+Click** is the universal "open link" shortcut
- **Enter** confirms link input in popovers
- **Escape** cancels/dismisses popovers
- No universal "unlink" shortcut exists (varies by app: Ctrl+Shift+F9 in Word)

### Paste Behaviors
- **Paste URL over selected text → auto-wrap as link**: Thought.Hauson, Linear, VS Code, and modern editors all support this. It's the zero-friction power-user pattern.
- **Paste raw URL → auto-link**: Most editors auto-detect and make URLs clickable on paste.
- **Paste URL with no selection**: Inserts the URL as both display text and href.

### Link Popover Design
- Modern editors use **inline popovers** (not modals) anchored to the link text
- Typical actions: URL display, edit, copy, open in new tab, unlink/remove
- Popovers appear on **click** (not hover — hover would be too aggressive)
- Edit mode transforms the popover in-place (URL display → URL input)

### Visual Link Styling
- Accent color for link text is standard
- Underline (solid) for external links
- Hover: intensify underline or add subtle background
- Some editors (Bear, Obsidian) use dotted/dashed underlines for internal wiki-style links

## TipTap Technical Findings

### @tiptap/extension-link
- Official Link extension available for TipTap 3.x
- Configurable: `openOnClick`, `autolink`, `linkOnPaste`, `HTMLAttributes`
- Renders as `<a>` elements with configurable attributes
- Works with the Markdown extension for `[text](url)` serialization

### BubbleMenu Extension
- `@tiptap/extension-bubble-menu` provides floating menus near text selections
- `shouldShow` option controls when the menu appears (can filter by active marks)
- Supports multiple independent bubble menus via unique `pluginKey`
- Can be React/Vue components or vanilla JS

### Custom Approach Benefits
- More control over show/hide timing (delayed show for keyboard nav)
- Different content for different contexts (creation vs editing)
- Custom animation control
- Direct ProseMirror plugin for paste interception

## Accessibility Standards (WCAG)

- Links must be keyboard focusable via Tab
- Links must be activatable via Enter key
- Popovers need `role="dialog"` and `aria-label`
- Focus must be trapped inside open popovers
- Focus returns to trigger element when popover closes
- Link creation should be announced via `aria-live` region
- All popover buttons need `aria-label` attributes

## Key Design Decisions for Thought.Haus

Based on research, recommended approach:

1. **Paste-over-selection as primary creation method** — matches Thought.Hauson/Linear, zero friction
2. **Cmd+K as deliberate creation method** — universal convention, context-aware
3. **Inline popover, not modal** — matches modern editor patterns, less disruptive
4. **Solid underline for URL links, dotted for NoteLinks** — visual differentiation
5. **Click shows popover, Cmd+Click opens URL** — matches VS Code/Thought.Hauson convention
6. **Custom popover positioning** over TipTap BubbleMenu — better animation/timing control
7. **No URL validation** — Markdown philosophy, any string is valid href
