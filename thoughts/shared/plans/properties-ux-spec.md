# Properties UX Specification

> A comprehensive design specification for Thought.Haus's note properties system — structured metadata editing that feels like a natural extension of the note, not a database bolted on.

---

## 1. Design Philosophy

### The Core Idea

Properties are **quiet metadata that lives with the note**. They're visible when present, invisible when absent, and editable with the same effortless inline patterns used for the title and tags. The design borrows two key ideas and rejects one from each inspiration:

**From Obsidian, we take:**
- Properties as a visual section at the top of the note, inline with content — not banished to a sidebar
- Autocomplete for property names to drive consistency across notes
- Collapsible section so properties stay out of the way during writing

**From Obsidian, we reject:**
- The "Properties" heading banner with disclosure triangle — it's heavy and institutional
- Type icons doubling as drag handles — too much hidden functionality
- The clunky, form-like feeling of their property rows

**From Linear, we take:**
- Muted labels / prominent values — the data matters, not the labels
- Consistent vertical rhythm with no borders between rows — whitespace does the work
- The feeling of density without clutter

**From Linear, we reject:**
- Sidebar placement — properties belong with the note body
- Fixed field schema — Thought.Haus properties are freeform

### Guiding Principles

1. **Invisible until needed.** A note with no properties shows nothing. No empty section, no placeholder, no "Add your first property!" prompt. Just the existing title → tags → date → body flow.

2. **Part of the note, not a panel.** Properties sit between the metadata row and the editor body. They're rendered in the same warm palette, at the same scale, with the same padding. They feel like a natural continuation of the note header.

3. **Keyboard-native, mouse-friendly.** Every operation (add, edit, remove) is possible with keyboard alone. But mouse users should never feel like second-class citizens.

4. **Immediate persistence.** Like the title and tags, property edits save immediately via `upsertNote()` → `saveNote()`. No save button, no confirmation dialog.

5. **Respect the file.** The properties UI is a 1:1 visual representation of the YAML frontmatter. What you see is what's in the file. No hidden state, no metadata that only exists in the UI.

---

## 2. Layout & Visual Design

### Position in the Component Tree

Properties live as a new `<div className={styles.properties}>` inserted between `.metadata` and `.editorBody` inside the existing `.header` container. This keeps the entire note header (title + tags/date + properties) as one scrollable unit that stays above the editor.

```
<main .editor>
  <div .header>
    <div .titleRow>        ← star button + title input + actions
    <div .metadata>        ← tag pills + date (unchanged)
    <div .properties>      ← NEW: property rows + add button
  </div>
  <div .editorBody />      ← TipTap (unchanged)
  <div .statusBar />       ← word count + save status (unchanged)
</main>
```

The `.properties` div is a **direct child of `.header`**, not nested inside `.metadata`. This is intentional — properties need vertical space that the single-row `.metadata` flex layout can't provide.

### Wireframes

#### Note with no properties

Nothing changes. The properties section is not rendered at all.

```
┌──────────────────────────────────────────────────────────┐
│  ☆  Meeting Notes                          Attach  Delete│
│                                                          │
│  work  planning  q1                   February 14, 2026  │
│                                            + property    │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Today we discussed the roadmap for Q1...                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

The `+ property` button sits at the right edge of the metadata row — right-aligned, inline with the date. It's subtle: dashed border, secondary text color, same pill shape as `+ tag`. It only appears on hover over the metadata area (or always visible if the note already has properties).

#### Note with 1–3 properties

```
┌──────────────────────────────────────────────────────────┐
│  ☆  Meeting Notes                          Attach  Delete│
│                                                          │
│  work  planning  q1                   February 14, 2026  │
│                                                          │
│  status       In Progress                                │
│  project      Q1 Roadmap                                 │
│  owner        Sarah                          + property  │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Today we discussed the roadmap for Q1...                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Properties are a compact key-value list. Each row is a single line. The `+ property` button sits at the end of the last row, right-aligned.

#### Note with many properties (6+)

```
┌──────────────────────────────────────────────────────────┐
│  ☆  Meeting Notes                          Attach  Delete│
│                                                          │
│  work  planning  q1                   February 14, 2026  │
│                                                          │
│  ▾ Properties (6)                                        │
│  status       In Progress                                │
│  project      Q1 Roadmap                                 │
│  owner        Sarah                                      │
│  priority     High                                       │
│  due          2026-03-15                                 │
│  reviewer     Jordan                         + property  │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Today we discussed the roadmap for Q1...                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

When a note has 4+ properties, a **section header** appears: a small clickable `▾ Properties (N)` label that collapses/expands the section. Below 4, no header — the properties are just there, simple and direct.

#### Note with many properties, collapsed

```
┌──────────────────────────────────────────────────────────┐
│  ☆  Meeting Notes                          Attach  Delete│
│                                                          │
│  work  planning  q1                   February 14, 2026  │
│                                                          │
│  ▸ Properties (6)                                        │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Today we discussed the roadmap for Q1...                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Collapsed: just the header with a count. One click to expand.

#### Adding a property

```
┌──────────────────────────────────────────────────────────┐
│  ☆  Meeting Notes                          Attach  Delete│
│                                                          │
│  work  planning  q1                   February 14, 2026  │
│                                                          │
│  status       In Progress                                │
│  project      Q1 Roadmap                                 │
│  [key name ]  [value          ]              + property  │
│  ┌─────────────────┐                                     │
│  │ priority        │  ← autocomplete dropdown            │
│  │ due             │                                     │
│  │ reviewer        │                                     │
│  │ source          │                                     │
│  └─────────────────┘                                     │
│──────────────────────────────────────────────────────────│
│                                                          │
│  Today we discussed the roadmap for Q1...                │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

A new row appears with the key input focused. An autocomplete dropdown suggests property names used in other notes.

### Spacing & Typography

| Element | Value | Rationale |
|---------|-------|-----------|
| `.properties` margin-top | `0.625rem` (10px) | Breathing room below metadata row |
| `.properties` margin-bottom | `0` | The `.header` padding-bottom (1rem) provides space before editor body |
| Property row height | `1.5rem` (24px) | Compact single-line rows |
| Row gap | `0.125rem` (2px) | Tight vertical rhythm — properties should feel like a list, not a form |
| Key label width | `6rem` (96px) | Enough for typical property names; longer names truncate with ellipsis |
| Key label font-size | `0.6875rem` (11px) | Matches `.tagPill` / `.statusBar` — the "small text" tier |
| Key label font-weight | `400` | Normal weight — muted, not bold |
| Key label color | `var(--color-text-secondary)` | Muted labels, prominent values |
| Value font-size | `0.8125rem` (13px) | Matches `.metadata` font size |
| Value font-weight | `400` | Normal weight |
| Value color | `var(--color-text)` | Primary text — the value is what matters |
| Section header font-size | `0.625rem` (10px) | Tiny, unobtrusive |
| Section header font-weight | `500` | Medium weight for legibility at small size |
| Section header color | `var(--color-text-secondary)` | Muted |
| Section header letter-spacing | `0.04em` | Slight tracking for readability at small size |
| Horizontal alignment | Left-aligned with `3rem` padding | Matches header/editor/status bar horizontal rhythm |

### Key-Value Alignment

Property rows use a **two-column flexbox layout**:

```css
.propertyRow {
  display: flex;
  align-items: center;
  height: 1.5rem;
  gap: 0.5rem;
}

.propertyKey {
  width: 6rem;
  flex-shrink: 0;
  /* label styling */
}

.propertyValue {
  flex: 1;
  min-width: 0;
  /* value styling */
}
```

Keys are left-aligned, fixed-width. Values take the remaining space. This creates a clean left edge for values that scans well vertically.

---

## 3. Properties Section Anatomy

### Property Row

Each property is a single horizontal row:

```
[key label      ]  [value text                              ] [×]
 ↑ 6rem fixed      ↑ flex: 1                                  ↑ hidden until hover
```

**Key label** (`.propertyKey`):
- `width: 6rem`, `flex-shrink: 0`
- `font-size: 0.6875rem`, `color: var(--color-text-secondary)`
- `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap`
- `text-align: left`
- `cursor: default` (keys are not directly editable after creation — see Interaction Patterns)
- `line-height: 1.5rem` (vertically centered in the row)

**Value display** (`.propertyValue` in read mode):
- `flex: 1`, `min-width: 0`
- `font-size: 0.8125rem`, `color: var(--color-text)`
- `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap`
- `cursor: text` (indicates clickability)
- `line-height: 1.5rem`
- `padding: 0` — no visible input chrome in read mode
- `border: 1px solid transparent` — reserves space for focus state border
- `border-radius: 4px`

**Value input** (`.propertyValue` in edit mode):
- Same dimensions as read mode (no layout shift)
- `border: 1px solid var(--color-accent)`
- `box-shadow: 0 0 0 3px var(--color-focus-ring)`
- `background: var(--color-bg)`
- `outline: none`
- `padding: 0 0.25rem` — slight horizontal padding when active

The transition between read mode and edit mode is CSS-only: the input is always an `<input>` element, but in read mode it has `border-color: transparent` and `background: transparent`, making it look like plain text. On focus, it gains the accent border and focus ring. This is the same pattern as `.titleInput`.

**Remove button** (`.propertyRemove`):
- Positioned at the end of the row
- `width: 1rem`, `height: 1rem`
- `opacity: 0` by default
- Appears on `.propertyRow:hover` → `.propertyRemove { opacity: 0.5 }`
- On `.propertyRemove:hover` → `opacity: 1`, `color: var(--color-danger)`
- Uses the `X` icon from `lucide-preact` at `size={10}`
- `border: none`, `background: none`, `cursor: pointer`
- `border-radius: 50%`
- Hover background: `var(--color-danger-subtle)`
- Transition: `opacity 0.15s ease, color 0.15s ease, background 0.15s ease`

### "Add Property" Button

Two placements depending on context:

**When the note has no properties:**
- The `+ property` button appears at the right end of the `.metadata` row, after the date
- Styled identically to `.addTagBtn`: dashed border, pill shape, secondary text
- Only visible on hover over the `.metadata` area (or on focus via keyboard)

**When the note already has properties:**
- The `+ property` button appears at the end of the last property row, right-aligned
- Same dashed-pill styling as `+ tag`
- Always visible (not hover-gated, since the properties section is already showing)

```css
.addPropertyBtn {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  border: 1px dashed var(--color-border);
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s ease, color 0.15s ease;
  white-space: nowrap;
}
.addPropertyBtn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}
```

### Section Header (4+ properties only)

```
▾ Properties (6)
```

- `font-size: 0.625rem`
- `font-weight: 500`
- `color: var(--color-text-secondary)`
- `letter-spacing: 0.04em`
- `text-transform: uppercase`
- `cursor: pointer`
- `user-select: none`
- The `▾` / `▸` chevron is a Lucide `ChevronDown` / `ChevronRight` icon at `size={10}`
- `gap: 0.25rem` between icon and text
- `margin-bottom: 0.25rem` below the header (before the first property row)
- Hover: `color: var(--color-text)` — subtle darkening

### Empty State

There is no empty state. When a note has no properties, the `.properties` div is not rendered. The `+ property` affordance in the metadata row is the only hint that properties are possible.

---

## 4. Interaction Patterns

### Adding a Property

**Trigger:** Click `+ property` button, or press `Cmd/Ctrl + ;` keyboard shortcut.

**Flow:**

1. A new row appears at the bottom of the properties list (or as the first row if none exist).
2. The **key name input** is focused. It's a text input with:
   - `placeholder="key"` in muted text
   - An **autocomplete dropdown** that appears below the input showing property names used in other notes in the folder (see Section 6)
3. User types a key name. The autocomplete filters as they type.
4. User presses **Tab** or selects an autocomplete suggestion → focus moves to the **value input**.
5. User types a value.
6. User presses **Enter** or **Tab** → the property is committed. `upsertNote()` + `saveNote()` fires.
7. If the user presses **Enter**, focus moves to a *new* add-property row (for rapid entry of multiple properties).
8. If the user presses **Tab**, focus moves to the next focusable element below (the editor body or the next property row's value).
9. If the user presses **Escape** at any point → the new row is removed. Focus returns to the `+ property` button.

**Cancellation:**
- Pressing Escape in the key input → row removed, no save.
- Pressing Escape in the value input → row removed, no save.
- Blurring the key input while it's empty → row removed.
- Blurring the value input while key is non-empty but value is empty → property is saved with empty string value (this is valid — a property can have an empty value).

### Editing a Value

1. **Click** on any property value → the input gains focus, border appears, focus ring shows.
2. Type to edit. The existing text is fully selected on focus (like clicking into a URL bar) for easy replacement.
3. **Enter** or **blur** → saves. `upsertNote()` with updated properties → `saveNote()`.
4. **Escape** → reverts to the previous value. Focus moves to the property value (stays on the row but exits edit mode).

There is no separate "read mode" vs "edit mode" component swap. The value is always an `<input>` — it just looks like text until focused.

### Editing a Key

Keys are **not directly editable** after creation. This is intentional:

- Keys are identifiers. Casually changing a key name could break any future integrations (search filters, templates, etc.).
- The correct flow is: remove the property, add a new one with the desired key name.
- This matches Linear's approach where field names are fixed.

If we need key editing in the future, it would be via a right-click context menu or a dedicated "Rename property" command in the command palette.

### Removing a Property

**Mouse:**
1. Hover over a property row → the `×` remove button fades in at the right edge.
2. Click the `×` button → property is immediately removed. `upsertNote()` with the key deleted from properties → `saveNote()`.
3. No confirmation dialog. The save is immediate.

**Keyboard:**
1. When a property value input is focused, press `Cmd/Ctrl + Backspace` → the property is removed.
2. Focus moves to the value input of the row above. If it was the first/only row, focus moves to the `+ property` button.

### Keyboard Navigation

| Action | Shortcut |
|--------|----------|
| Add new property | `Cmd/Ctrl + ;` |
| Move to next property value | `Tab` |
| Move to previous property value | `Shift + Tab` |
| Save current edit | `Enter` |
| Cancel current edit | `Escape` |
| Delete current property | `Cmd/Ctrl + Backspace` |
| Move from properties to editor | `Tab` from last property (or `Escape` from value) |

Tab order within the properties section visits **only values, not keys**. Keys are display-only after creation. The tab sequence is: tag input area → `+ property` button → property value 1 → property value 2 → ... → `+ property` button (at bottom) → editor body.

### Focus Management

| After this action... | Focus goes to... |
|---------------------|------------------|
| Adding a property (Enter in value) | New add-property key input (for rapid multi-add) |
| Adding a property (Tab in value) | Next property value or editor body |
| Adding a property (blur from value) | Wherever the user clicked |
| Editing a value (Enter) | The same value input (deselected) |
| Editing a value (Escape) | The same value input (reverted, blurred) |
| Removing a property (click ×) | Value of the row above, or `+ property` button |
| Removing a property (Cmd+Backspace) | Value of the row above, or `+ property` button |
| Collapsing properties section | Section header (stays focused) |
| Expanding properties section | Section header (stays focused) |

---

## 5. Collapse/Expand Behavior

### When the Section Header Appears

The collapsible section header (`▾ Properties (N)`) **only appears when a note has 4 or more properties**. Notes with 1–3 properties show the rows directly with no header — there's nothing to collapse at that scale.

### Trigger

Click the section header text, or press Enter/Space when the header is focused.

### Collapsed State

When collapsed:
- Only the header is visible: `▸ Properties (6)`
- The `+ property` button is hidden (it's inside the collapsed section)
- All property rows are hidden

When expanded:
- The header shows: `▾ Properties (6)`
- All property rows are visible
- The `+ property` button is visible at the bottom

### Persistence

Collapsed state is stored **per-note** in `localStorage` using the key `noti:props-collapsed:<noteId>`. Default: expanded.

This is a UI preference, not note data — it doesn't go in frontmatter. Different users viewing the same file can have different collapsed states.

### Transition

Collapse/expand uses a `max-height` transition with `overflow: hidden`:

```css
.propertiesList {
  overflow: hidden;
  transition: max-height 0.2s ease, opacity 0.15s ease;
}
.propertiesListCollapsed {
  max-height: 0;
  opacity: 0;
}
```

The transition is quick (200ms) — just enough to communicate the spatial relationship, not so slow that it feels sluggish.

---

## 6. Key Name Autocomplete

### Data Source

When the user is typing a property key name, we suggest **all unique property key names** currently used across all notes in the folder. This data is derived from the `notesMap` signal — iterate all notes and collect `Object.keys(note.properties)` into a deduplicated, sorted list.

This computation should be memoized (computed signal or `useMemo`) to avoid recalculating on every keystroke.

### UI

The autocomplete is a **dropdown list** that appears directly below the key name input:

```
[pri          ]
┌─────────────────┐
│ priority        │  ← highlighted (first match)
│ price           │
│ project         │
└─────────────────┘
```

- **Container**: `position: absolute`, anchored below the key input
- `background: var(--color-bg)`, `border: 1px solid var(--color-border)`, `border-radius: 6px`
- `box-shadow: 0 4px 12px rgba(26, 26, 24, 0.08)`
- `max-height: 10rem`, `overflow-y: auto`
- `z-index: 10` (above other property rows)

- **Items**: `padding: 0.25rem 0.5rem`, `font-size: 0.8125rem`
- Highlighted item: `background: var(--color-accent-subtle)`, `color: var(--color-accent)`
- `cursor: pointer`

### Behavior

1. Dropdown appears as soon as the key input is focused, showing all available suggestions (if any).
2. As the user types, suggestions filter using **prefix matching** (case-insensitive).
3. `↓` / `↑` arrow keys navigate the highlighted suggestion.
4. `Enter` or click on a suggestion → selects it, populates the key input, moves focus to value input.
5. `Escape` → closes the dropdown without selecting (user can type a custom name).
6. If the typed text doesn't match any suggestion, no dropdown is shown. The user is creating a new property name.
7. If there are no existing property names across the folder (first-ever property), no dropdown appears.

### New Names

The autocomplete is a **suggestion**, not a constraint. Users can type any key name they want. There's no validation that the key must match an existing suggestion. This maintains the freeform nature of Thought.Haus properties while nudging toward consistency.

---

## 7. Reserved Keys & Validation

### Reserved Keys: `title`, `date`, `tags`

These three keys are handled by the existing UI (title input, date display, tag pills) and are managed separately in `parseFrontMatter` / `serializeFrontMatter`.

**Behavior when the user tries to add a reserved key:**

1. The user types `title`, `date`, or `tags` in the key name input.
2. The key input shows an **inline validation message** below it: `"title" is managed above` in `var(--color-text-secondary)` at `0.625rem`.
3. The Tab key and Enter key do **not** advance to the value input — they do nothing (the key is invalid).
4. The user must change the key name to proceed.

This is gentle guidance, not a hard error. The message is informative ("managed above" rather than "not allowed").

### Duplicate Key Names

If the user tries to add a property with a key that already exists on the current note:

1. The key input shows: `"status" already exists` in `var(--color-text-secondary)`.
2. Tab/Enter do not advance. The user must change the key name.

### Empty Key Names

If the user tabs away from the key input while it's empty, the new property row is removed. No validation message needed — just clean up silently.

### Key Name Normalization

Key names are **trimmed** (leading/trailing whitespace removed) but otherwise preserved as-is. No lowercasing, no slug conversion. Property keys are case-sensitive and can contain spaces, hyphens, or any other characters.

Rationale: unlike tags (which are used for categorization and benefit from normalization), property keys are arbitrary metadata identifiers. Users should be able to use natural casing like `Due Date` or `ISBN`.

### Value Validation

No validation on values. All values are strings. Empty strings are valid (a property can exist with no value).

---

## 8. Edge Cases

### Very Long Property Values

Values that exceed the available width are **truncated with ellipsis** in read mode (`text-overflow: ellipsis`). When the input is focused for editing, the full value is accessible by scrolling within the input. The input does not expand vertically — it remains single-line.

Future consideration: for values that truly need multi-line (like a description), we could add a "text area" property type that uses a resizable `<textarea>`. Not in v1.

### Very Long Property Keys

Keys are fixed-width (`6rem`). Long keys truncate with ellipsis. The full key name is visible as a `title` tooltip on hover.

If we see users consistently needing longer keys, we can increase the key width to `8rem` — but 6rem handles typical keys like `status`, `priority`, `due date`, `project`, `reviewer`, `source`, `url`, etc.

### Many Properties (10+)

The properties section has no max-height. All properties are visible when expanded. If a note has many properties, the header area simply gets taller, and the editor body below starts lower.

However, the **collapsible section header appears at 4+ properties**, which gives users a natural way to reclaim space. The header shows the count (`Properties (12)`), so users know what's hidden.

If a note has an absurd number of properties (20+), the header area's padding is sufficient — the editor body below will still scroll. No special scrolling behavior is needed for the properties section itself.

### Special Characters in Keys

Keys can contain any characters except `:` (which is the YAML key-value delimiter). If a user types a key containing `:`, trim everything after the first colon. This prevents YAML serialization issues.

Other special characters (spaces, hyphens, underscores, accented characters, emoji) are preserved as-is.

### Special Characters in Values

Values can contain any characters, including colons. The YAML serializer already handles this correctly (the parser uses `indexOf(":")` for the first colon only, taking everything after as the value).

### Property with Empty Value

Valid. The property is saved with an empty string value. In the YAML frontmatter, this becomes `key: ` (with nothing after the colon+space). In the UI, the value area shows the placeholder text from the input in muted color.

### Non-Thought.Haus-Format Notes

Notes with `isTimestampFormat: false` (plain `.md` files without the Thought.Haus naming convention) still support properties. The frontmatter behavior is the same. No special handling needed.

---

## 9. Dark Theme

The design uses CSS custom properties exclusively, so dark theme support is automatic. The key color mappings:

| Element | Light | Dark |
|---------|-------|------|
| Key label | `--color-text-secondary` (#94918a) | `--color-text-secondary` (#8a8780) |
| Value text | `--color-text` (#1a1a18) | `--color-text` (#e8e6e1) |
| Value input focus border | `--color-accent` (#b8621b) | `--color-accent` (#d4873a) |
| Value input focus ring | `--color-focus-ring` (rgba warm) | `--color-focus-ring` (rgba warm) |
| Remove button hover | `--color-danger` (#c24040) | `--color-danger` (#d45555) |
| Remove button hover bg | `--color-danger-subtle` (#fdf0ef) | `--color-danger-subtle` (#2e1a1a) |
| Add button border | `--color-border` (#e9e6de) | `--color-border` (#3a3835) |
| Add button hover | `--color-accent` | `--color-accent` |
| Autocomplete dropdown bg | `--color-bg` | `--color-bg` |
| Autocomplete dropdown border | `--color-border` | `--color-border` |
| Autocomplete highlight | `--color-accent-subtle` | `--color-accent-subtle` |
| Section header | `--color-text-secondary` | `--color-text-secondary` |

No dark-theme-specific CSS is needed. The existing variable system handles everything.

---

## 10. Accessibility

### ARIA Roles and Labels

```html
<!-- Properties section -->
<div role="group" aria-label="Note properties">

  <!-- Section header (when visible) -->
  <button
    role="button"
    aria-expanded="true|false"
    aria-controls="properties-list"
    aria-label="Properties (6), click to collapse"
  >
    ▾ Properties (6)
  </button>

  <!-- Properties list -->
  <div id="properties-list" role="list">

    <!-- Each property row -->
    <div role="listitem" aria-label="status: In Progress">
      <span class="propertyKey" id="prop-key-status">status</span>
      <input
        class="propertyValue"
        aria-labelledby="prop-key-status"
        value="In Progress"
      />
      <button aria-label="Remove property status">×</button>
    </div>

  </div>

  <!-- Add property button -->
  <button aria-label="Add property">+ property</button>

  <!-- New property row (when adding) -->
  <div role="listitem" aria-label="New property">
    <input aria-label="Property name" placeholder="key" />
    <input aria-label="Property value" placeholder="value" />
  </div>
</div>
```

### Keyboard-Only Operation

Every operation is possible without a mouse:

1. **Tab** into the properties section from the metadata area.
2. **Tab** between property values.
3. **Cmd/Ctrl + ;** to add a new property from anywhere in the note.
4. **Enter** to save edits and advance.
5. **Escape** to cancel edits.
6. **Cmd/Ctrl + Backspace** to delete the focused property.
7. **Enter/Space** on the section header to toggle collapse.

### Screen Reader Announcements

Use `aria-live="polite"` on a visually hidden status region:

- When a property is added: announce `"Property [key] added"`
- When a property is removed: announce `"Property [key] removed"`
- When properties section is collapsed: announce `"Properties collapsed, [N] properties"`
- When properties section is expanded: announce `"Properties expanded"`
- When a reserved key is entered: announce `"[key] is managed in the note header"`

### Focus Visibility

All interactive elements in the properties section use the standard Thought.Haus focus ring:

```css
:focus-visible {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
  outline: none;
}
```

This matches the existing focus style on `.searchInput:focus` and `.tagInput`.

---

## 11. Animation & Transitions

### Adding a Property

New property rows **slide in from above with a fade**:

```css
@keyframes propertySlideIn {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 1.5rem;
  }
}

.propertyRowEntering {
  animation: propertySlideIn 0.15s ease forwards;
}
```

Duration: 150ms. Quick enough to feel instant, slow enough to see the spatial origin.

### Removing a Property

Removed rows **fade out and collapse**:

```css
.propertyRowExiting {
  animation: propertySlideIn 0.12s ease reverse forwards;
}
```

Duration: 120ms. Slightly faster than entry — removal should feel snappy.

### Collapse/Expand

As described in Section 5: `max-height` + `opacity` transition, 200ms ease.

### Focus Ring

The focus ring uses the same `0.15s ease` transition as all other focus states in the app:

```css
.propertyValue {
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
```

### Hover Reveal (Remove Button)

```css
.propertyRemove {
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}
```

### "Add Property" Button Visibility (No-Properties State)

When the metadata area is hovered, the `+ property` button fades in:

```css
.addPropertyBtnHidden {
  opacity: 0;
  transition: opacity 0.15s ease;
}
.metadata:hover .addPropertyBtnHidden {
  opacity: 1;
}
```

---

## 12. Future Considerations

These are explicitly **not in scope** for v1 but are worth designing around:

### Property Types

The current implementation stores all values as `Record<string, string>`. Future type support could include:

- **Date**: value stored as ISO 8601 string, rendered with a date picker
- **Number**: value stored as numeric string, rendered with optional increment/decrement
- **Checkbox**: value stored as `"true"` / `"false"`, rendered as a toggle
- **List**: value stored as comma-separated string, rendered as pills

When adding types, the **type selector** could be a small icon to the left of the key label (like Obsidian) that opens a dropdown. But for v1, everything is a text string — no type system needed.

### Global Property Management

An "All Properties" view (accessible from the sidebar or command palette) that shows:
- Every property key used across all notes
- Usage count per key
- Ability to rename a key across all notes (batch frontmatter update)

This is valuable for maintaining consistency but is a separate feature, not part of the properties editor itself.

### Search/Filter by Property Values

Extension of the existing search engine to support queries like `[status:active]` or `has:priority`. This would involve indexing property values in MiniSearch, which is outside the scope of the properties UI.

### Property Templates

Pre-fill properties when creating notes based on certain signals:
- Notes created with a specific tag get default properties (e.g., `project` notes always get `status`, `priority`, `due`)
- This could be configured in a `.thoughthouse/templates/` directory

### Drag-and-Drop Reordering

Allow dragging property rows to reorder them within a note. The order would be reflected in the YAML frontmatter serialization order. Low priority — the current `Object.entries()` order (insertion order) is usually fine.

### Multi-Line Values

For property values that need more than one line (descriptions, long URLs, multi-paragraph text), a future property type could render a `<textarea>` that expands vertically. For v1, all values are single-line.

---

## Appendix: CSS Variable Reference

All CSS variables used in this spec, with their sources:

| Variable | Light Value | Dark Value | Source File |
|----------|------------|------------|-------------|
| `--color-bg` | `#fdfcfa` | `#1c1b1a` | `src/index.css` |
| `--color-surface` | `#f6f5f1` | `#252422` | `src/index.css` |
| `--color-border` | `#e9e6de` | `#3a3835` | `src/index.css` |
| `--color-text` | `#1a1a18` | `#e8e6e1` | `src/index.css` |
| `--color-text-secondary` | `#94918a` | `#8a8780` | `src/index.css` |
| `--color-accent` | `#b8621b` | `#d4873a` | `src/index.css` |
| `--color-accent-subtle` | `#fef7f0` | `#2e2418` | `src/index.css` |
| `--color-accent-hover` | `#a35718` | `#e09540` | `src/index.css` |
| `--color-danger` | `#c24040` | `#d45555` | `src/index.css` |
| `--color-danger-subtle` | `#fdf0ef` | `#2e1a1a` | `src/index.css` |
| `--color-tag-bg` | `#efece4` | `#33312c` | `src/index.css` |
| `--color-tag-text` | `#6d6a5e` | `#b0aa9f` | `src/index.css` |
| `--color-focus-ring` | `rgba(184,98,27,0.1)` | `rgba(212,135,58,0.15)` | `src/index.css` |
| `--font-sans` | `"Iosevka Aile", ...` | (same) | `src/index.css` |
