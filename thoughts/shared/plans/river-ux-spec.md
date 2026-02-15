# River: Multi-Editor Sidebar UX Spec

## 1. Competitive Analysis

### Logseq Right Sidebar

**How it works**: Shift-click any internal link (page, block, tag) to add it to a right sidebar. Items stack vertically in LIFO order (newest on top). The sidebar uses one continuous scroll for all items.

**What works well**:
- Shift-click is intuitive and universally understood
- Collapse/expand per item (added in v0.9.14) lets users manage vertical real estate
- Reordering via drag on headers
- `Cmd+C+C` to close all sidebar items at once

**What doesn't work**:
- **10+ items becomes chaotic** -- breadcrumb truncation makes it impossible to distinguish items
- One continuous scroll means losing your place when scrolling past many items
- No pinning -- users constantly request ability to pin items to the top
- Editing the same block in sidebar and main editor risks data loss (warned by devs)
- Tab system (Contents, Help, Page Graph) takes up space most users don't want
- No keyboard navigation between sidebar items
- Sidebar resize handle interferes with scrollbar

### Roam Research Right Sidebar

**How it works**: Shift-click any link or block to open in the right sidebar. Pages stack vertically. Each item has a collapse/expand toggle (-) next to its title. Toggle sidebar with `Cmd+/`.

**What works well**:
- Clean, minimal header per item -- just title + collapse toggle + X
- Can open both whole pages and individual block outlines
- Items are fully interactive and editable
- "Peripheral vision" use case -- keep reference material visible while writing

**What doesn't work**:
- All sidebar items scroll together (not independently) -- a persistent user complaint
- Opening multiple items from search closes the search bar each time
- Performance historically degraded with many blocks open (recently improved)
- No keyboard shortcut to dismiss individual items (only topmost)
- No reordering of items
- Same content in main + sidebar has no conflict resolution

### TiddlyWiki Story River

**How it works**: The main content area IS the river -- all open tiddlers stack vertically in a single scrollable column. Clicking a link opens (or navigates to) that tiddler in the river. Each tiddler renders through a ViewTemplate with title bar, toolbar buttons, subtitle, tags, and body.

**What works well**:
- **The purest expression of the "river" concept** -- the entire app IS a river of notes
- Each tiddler is a complete, self-contained card with clear visual boundaries
- Sticky title bars keep context visible while scrolling long tiddlers
- Modular template system lets each tiddler display differently
- Close button (X) directly on each tiddler's title bar

**What doesn't work**:
- No per-tiddler independent scrolling -- one continuous scroll for the entire river
- Bottom tiddler can't scroll to top (requires invisible spacer hack)
- Difficult to navigate between tiddlers in a long river (community plugins add tab bars)
- No native drag-to-reorder
- Content overlap issues when persistent UI elements (tab bars, menus) are present

### Obsidian Pane System

**How it works**: Notes open in tabs within pane groups. Ctrl+click opens in a new tab. Drag tab headers to create splits (horizontal/vertical). Each pane scrolls independently.

**What works well**:
- **Independent scroll per pane** -- each note has its own scroll context
- Same note open in two panes syncs edits in real-time
- Drag-and-drop with clear visual placement indicators (drop zones on edges)
- Pane resize via drag handles between panes
- Tab headers with close buttons, active-tab highlighting

**What doesn't work**:
- Scroll position can be lost when switching tabs
- The pane model is complex for casual users
- No "quick add to sidebar" gesture -- requires deliberate split/drag
- Side pane borders can feel visually heavy
- The Sliding Panes community plugin (Andy Matuschak mode) shows demand for a simpler stacking model

### Summary of Lessons

| Dimension | Best practice | Avoid |
|---|---|---|
| **Adding items** | Shift-click (universal) | Requiring complex drag-to-split |
| **Scroll** | Per-item independent scroll (Obsidian) | Single continuous scroll (Logseq/Roam) |
| **Visual hierarchy** | Clear card boundaries, sticky headers | Breadcrumb truncation, items blending together |
| **Same note in two places** | Real-time sync (Obsidian) | Silent data loss risk (Logseq) |
| **Removal** | X button on each item header | Only "close all" with no per-item control |
| **Reordering** | Drag on header (Logseq) | No reordering at all (Roam) |
| **Many items** | Collapse to title-only mode | Letting the list grow unbounded |

---

## 2. Recommended Interaction Patterns

### 2.1 Adding Notes to the River

**Primary gesture: Shift-click**
- Shift-clicking a note anywhere in the app adds it to the River:
  - Note list items in the sidebar
  - Favorite items in the nav sidebar
  - `[[note links]]` rendered in the editor (CodeMirror widgets)
  - Search results
- Visual feedback: brief flash animation on the added item (pulse of `--color-accent-subtle` fading out over 300ms)
- If the note is already in the River: scroll to it and flash its header instead of duplicating
- New items prepend to the top (LIFO), matching Logseq/Roam convention
- The River panel auto-opens if it isn't already visible

**Secondary gesture: Context menu**
- Right-clicking a note anywhere shows "Open in River" option
- Keyboard: `Cmd+Shift+R` on selected note adds to River

**Cursor feedback**
- When holding Shift and hovering over a clickable note reference, show a small "+" badge or change cursor to indicate the River-add action

### 2.2 Toggling the Right Panel

The right panel houses both the AI Assistant and the River. A vertical icon tab bar at the top-right of the panel switches between views.

- `Cmd+Shift+A` toggles AI Assistant (existing)
- `Cmd+Shift+R` toggles River panel
- If the panel is closed and either shortcut is pressed, the panel opens to that view
- If the panel is open on AI and user presses `Cmd+Shift+R`, it switches to River (no close/reopen)
- The panel remembers its last-used width independently

### 2.3 Visual Feedback on Add

When a note is shift-clicked into the River:
1. If the panel is closed, it slides open (200ms ease-out)
2. If on the AI tab, it switches to the River tab
3. The new note card appears at the top with a subtle slide-down animation (150ms)
4. The card header flashes briefly with `--color-accent-subtle` background (fades over 400ms)

---

## 3. Wireframe Descriptions

### 3.1 Right Panel with Icon Tab Bar

```
+------------------------------------------+
| [AI icon] [River icon]         [X close] |  <-- icon tab bar, 40px height
+------------------------------------------+
|                                          |
|          (active view content)           |
|                                          |
+------------------------------------------+
```

**Icon tab bar details**:
- Height: 40px, background: `--color-surface`
- Two icon buttons on the left side:
  - AI: `MessageSquare` icon from lucide (16px)
  - River: `Layers` icon from lucide (16px) -- visually suggests stacking
- Active tab: `--color-accent` icon color + 2px bottom border in `--color-accent`
- Inactive tab: `--color-text-secondary` icon color
- Close button (X) on the right side, same styling as current agent panel close button
- Bottom border: 1px solid `--color-border`

### 3.2 River View with Multiple Notes

```
+------------------------------------------+
| [AI] [River*]                       [X]  |
+------------------------------------------+
| +--------------------------------------+ |
| | Meeting Notes            [^] [x]     | |  <-- note card header
| |--------------------------------------| |
| | # Meeting Notes                      | |  <-- editable CodeMirror content
| | Date: 2024-03-22                     | |
| | ...                                  | |
| | (independently scrollable)           | |
| +--------------------------------------+ |
|                                          |  <-- 8px gap between cards
| +--------------------------------------+ |
| | Design Ideas              [^] [x]    | |
| |--------------------------------------| |
| | ## Color Palette                     | |
| | The warm tones should...             | |
| | ...                                  | |
| +--------------------------------------+ |
|                                          |
| +--------------------------------------+ |
| | Reading List               [^] [x]   | |
| |--------------------------------------| |
| | - Book A                             | |
| | - Book B                             | |
| +--------------------------------------+ |
+------------------------------------------+
```

**Card anatomy**:
- **Card container**: `--color-bg` background, 1px border `--color-border`, border-radius 8px, overflow hidden
- **Card header** (sticky within card):
  - Height: 36px
  - Background: `--color-surface`
  - Left: note title (0.8125rem, font-weight 600, color `--color-text`, truncated with ellipsis)
  - Right: collapse button (`ChevronDown`/`ChevronRight`, 14px) + close button (`X`, 14px)
  - Bottom border: 1px solid `--color-border`
  - Drag handle: the entire header is draggable for reordering (cursor: grab)
  - Clicking the title navigates to that note in the main editor
- **Card body**:
  - Contains a full CodeMirror editor instance
  - Padding: matches main editor padding
  - Max-height when expanded: 400px (configurable via CSS var `--river-card-max-height`)
  - Independently scrollable within the card (overflow-y: auto)
  - When the card content is shorter than max-height, the card sizes to content

**Card states**:
- **Expanded** (default): header + scrollable editor content, max-height 400px
- **Collapsed**: header only, 36px height, `ChevronRight` icon rotated to indicate collapsed state
- **Focused**: when editing, card gets a subtle box-shadow `0 0 0 2px var(--color-focus-ring)` and the header title becomes `--color-accent`

### 3.3 River Empty State

```
+------------------------------------------+
| [AI] [River*]                       [X]  |
+------------------------------------------+
|                                          |
|                                          |
|            [Layers icon, 32px]           |
|                                          |
|         Shift-click any note to          |
|          open it in the River            |
|                                          |
|       Notes stack here for quick         |
|         reference and editing            |
|                                          |
|                                          |
+------------------------------------------+
```

- Centered content, `--color-text-secondary` color
- Icon: `Layers` from lucide at 32px, `--color-border` color
- Primary text: 0.875rem, secondary text: 0.8125rem
- Matches the visual pattern of the existing AI empty state

### 3.4 Single Note in River

When only one note is in the River, it should feel spacious and not cramped:
- The card still has max-height constraint (400px) -- it should not fill the entire panel
- Below the card, show subtle hint text: "Shift-click more notes to add them here" in `--color-text-secondary`, 0.75rem

---

## 4. Scroll & Navigation

### 4.1 Outer Scroll (River Container)

The River container itself scrolls vertically to show all note cards:
- Scrollbar: thin, styled with `--color-scrollbar` (matching existing scrollbar conventions)
- Padding: 8px on all sides
- Gap between cards: 8px
- When a new note is added to the top, the River container scrolls to top (smooth scroll, 200ms)

### 4.2 Inner Scroll (Per-Card)

Each note card has its own independent scroll context:
- **This is the key UX differentiator over Logseq/Roam** -- borrowed from Obsidian's per-pane approach
- Max-height of 400px for the card body (the CodeMirror editor region)
- When content exceeds max-height, the card body scrolls independently
- The card header remains sticky at the top of the card (not the viewport)
- Scrollbar within each card uses the same thin styling

### 4.3 Jumping Between Notes

- **Click card header title**: scrolls the main editor to that note (navigates `selectedNoteId`)
- **Keyboard**: `Cmd+Shift+Up/Down` cycles focus between River cards
- **When a card is focused**: a visible focus ring appears around the card border
- **Double-click card header**: expands that card to fill the entire River panel height temporarily (toggle)

### 4.4 Scroll Position Preservation

- Each card remembers its scroll position when the user switches away and back
- When the River panel is closed and reopened, scroll positions are restored
- When collapsing and re-expanding a card, scroll position is preserved

---

## 5. Edit Experience

### 5.1 Clicking Into a River Note

- Clicking anywhere in the card's CodeMirror body focuses that editor instance
- The card enters "focused" state: subtle accent ring around the card border
- The main editor (if showing the same note) is NOT affected -- both can be edited independently
- Cursor appears at click position, standard CodeMirror editing behavior

### 5.2 Same Note in Two Places

This is the most critical UX scenario. When the same note is open in both the main editor and a River card:

**Recommended approach: Real-time sync (Obsidian model)**
- Both editors share the same underlying document content via signals
- Edits in one editor immediately appear in the other
- Cursor positions are independent -- each editor tracks its own cursor and selection
- Scroll positions are independent
- Save status is shared (one save covers both)

**Visual indicator**: When a River card shows the same note as the main editor, add a small dot or badge on the card header in `--color-accent` to indicate the "linked" state. Tooltip: "Also open in main editor".

**Implementation note**: This likely requires sharing the CodeMirror `EditorState` or using a shared document model with separate views. The exact mechanism is a technical decision, but the UX must feel seamless -- typing in one place should update the other within a single frame.

### 5.3 Focus States

- **Card unfocused**: normal card border (`--color-border`)
- **Card hovered**: card border becomes slightly darker (`--color-text-secondary` at 0.3 opacity)
- **Card editor focused**: card border becomes `--color-accent` at 0.15 opacity ring, header title text turns `--color-accent`
- **Card header hovered**: header background shifts to `--color-note-hover`

### 5.4 Save Behavior

- River card edits auto-save with the same debounce strategy as the main editor
- The save status indicator in the main editor header reflects saves from any editor instance (main or River)
- No separate save status per River card -- keep it simple

---

## 6. Removal & Reordering

### 6.1 Removing Notes from River

**X button**: Each card header has an X button on the right side
- Click to remove (immediate, no confirmation)
- Card animates out: slides up + fades out (150ms)
- Remaining cards shift up smoothly (150ms ease)
- The note is NOT deleted from disk -- only removed from the River list
- Keyboard: when a card has focus, `Cmd+W` removes it from the River

**Clear all**: A small "Clear all" text button appears at the bottom of the River when 3+ cards are present
- Click shows a simple confirmation: "Remove all notes from River?"
- Styled as a text link in `--color-text-secondary`, 0.75rem

### 6.2 Reordering Notes

**Drag to reorder**:
- Grab the card header (cursor: grab, changes to grabbing while dragging)
- A translucent ghost of the card follows the cursor
- A 2px accent-colored line indicates the drop position between other cards
- Drop to reorder -- the card animates into its new position (150ms ease)
- The reordered list is persisted to `.thoughthouse/river.json`

**No drag handle icon**: The entire header serves as the drag target. This is cleaner than adding a dedicated grip icon, and headers are already visually distinct from content areas.

### 6.3 Persistence

River state is persisted to `.thoughthouse/river.json`, following the same pattern as `.thoughthouse/favorites.json`:

```json
{
  "version": 1,
  "river": ["20240322T131856", "20240315T090000", "20240310T142200"],
  "collapsed": ["20240315T090000"]
}
```

- `river`: ordered array of note IDs (top to bottom)
- `collapsed`: array of note IDs that are in collapsed state
- Debounced save (300ms), same as favorites
- On load, stale IDs (notes that no longer exist) are silently filtered out

---

## 7. Edge Cases

### 7.1 Empty State

Covered in section 3.3. The empty state uses the same visual language as the AI panel's empty state -- centered icon, explanatory text, no action button needed.

### 7.2 Very Long Notes

- Card body max-height is 400px with independent scroll
- This prevents any single note from dominating the River
- Double-click header to temporarily expand to full panel height (for focused reading)
- The expanded state is NOT persisted -- it resets when switching away or reopening the panel

### 7.3 Many Notes in River (10+)

This is where the per-card independent scroll pays off:
- Each collapsed card is only 36px -- 10 collapsed cards = 360px, easily manageable
- Recommend a soft limit of ~15 notes in the River; beyond that, show a subtle warning: "Consider closing some notes for better performance"
- No hard limit enforced
- The River container's own scrollbar handles navigation between many cards
- Cards that are scrolled out of view should have their CodeMirror instances deferred (created on first scroll-into-view) for performance

### 7.4 Narrow Panel Width

When the right panel is resized narrow (approaching min-width 280px):
- Card header truncates the note title with ellipsis
- CodeMirror content wraps normally (line wrapping is already the default)
- The icon tab bar icons remain at fixed size; the close button stays visible
- Card header buttons stack more tightly (reduce gap from 0.25rem to 0.125rem)
- At min-width, the experience is still usable for reading and light editing

### 7.5 Note Deleted While in River

If a note is deleted (from the main editor or externally):
- The River card for that note shows a muted "Note deleted" message in place of the editor
- The card can still be dismissed with X
- On next River load, the stale ID is filtered out automatically

### 7.6 River Panel Closed with Unsaved Edits

- River cards use the same auto-save as the main editor
- If the panel is closed, any pending saves complete (the save is debounced, not cancelled)
- When reopened, editors are re-created from the persisted file content

### 7.7 Same Note Added Twice

- Shift-clicking a note that's already in the River does NOT duplicate it
- Instead: the River scrolls to the existing card, and the card header flashes briefly
- This prevents accidental duplication and matches user expectation

### 7.8 Responsive Behavior

- If the browser window is very narrow (< 800px total), the right panel should auto-collapse
- The River icon in the tab bar should show a badge (small dot) when the River has items but the panel is closed

---

## 8. Design Token Reference

All River-specific values should use existing CSS custom properties where possible:

| Element | Property | Value |
|---|---|---|
| Panel background | background | `--color-surface` |
| Card background | background | `--color-bg` |
| Card header background | background | `--color-surface` |
| Card border | border | `1px solid var(--color-border)` |
| Card border-radius | border-radius | `8px` |
| Card gap | gap | `8px` |
| Title font | font-size, weight | `0.8125rem`, `600` |
| Focus ring | box-shadow | `0 0 0 2px var(--color-focus-ring)` |
| Active tab indicator | border-bottom | `2px solid var(--color-accent)` |
| Icon color (active) | color | `--color-accent` |
| Icon color (inactive) | color | `--color-text-secondary` |
| Empty state text | color | `--color-text-secondary` |
| Scrollbar | scrollbar-color | `var(--color-scrollbar) transparent` |

New CSS custom properties (add to `:root`):
- `--river-card-max-height: 400px` -- configurable max height for expanded cards
- `--river-card-header-height: 36px` -- card header height

---

## 9. Keyboard Shortcuts Summary

| Shortcut | Action |
|---|---|
| `Shift+Click` (on any note reference) | Add note to River |
| `Cmd+Shift+R` | Toggle River panel |
| `Cmd+Shift+A` | Toggle AI panel (existing) |
| `Cmd+Shift+Up/Down` | Cycle focus between River cards |
| `Cmd+W` (when River card focused) | Remove card from River |
| `Cmd+Shift+Backspace` | Clear all River cards (with confirm) |

---

## 10. Animation Spec

| Animation | Duration | Easing | Description |
|---|---|---|---|
| Panel open/close | 200ms | ease-out | Panel slides in from right edge |
| Card add | 150ms | ease-out | New card slides down from top, opacity 0->1 |
| Card remove | 150ms | ease-in | Card slides up + fades out |
| Card reorder | 150ms | ease | Cards shift to new positions |
| Header flash | 400ms | ease-out | Background color pulses `--color-accent-subtle` -> transparent |
| Collapse/expand | 150ms | ease | Card body height animates |
| Tab switch | 100ms | ease | Content cross-fades |
