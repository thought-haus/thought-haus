# Properties Editor — Codebase Context

Technical analysis of Thought.Haus's current UI patterns, design tokens, and integration
points relevant to adding a properties editor to the note screen.

---

## 1. Editor View Component Structure

**File:** `src/ui/editor-view.tsx`

The EditorView is the main note editing surface. Its render tree (lines 251–375):

```
<main .editor>
  <div .header>                           <!-- line 253 -->
    <div .titleRow>                       <!-- line 254 -->
      <button .starBtn />                 <!-- line 255–263: favorite toggle -->
      <input .titleInput />               <!-- line 264–278: inline title editing -->
      <div .headerActions>                <!-- line 279–310: attach + delete buttons -->
    </div>
    <div .metadata>                       <!-- line 312–363 -->
      <div .tags>                         <!-- line 313–355: tag pills + add tag -->
        {note.tags.map → <span .tagPill>} <!-- line 314–325 -->
        <input .tagInput /> | <button .addTagBtn /> <!-- line 326–354 -->
      </div>
      <span .date />                      <!-- line 356–362: created date display -->
    </div>
  </div>
  <div .editorBody ref={containerRef} />  <!-- line 365: TipTap mount point -->
  <div .statusBar>                        <!-- line 366–373: word count + save status -->
</main>
```

### Title Editing (lines 264–278, 209–221)

- `titleDraft` local state initialized from `note.title` on selection change (line 118)
- `<input>` with `onInput` → `setTitleDraft`, `onBlur` → `commitTitle()`, Enter → blur
- `commitTitle()` (lines 209–221): trims, skips if unchanged, calls `renameNote(noteId, trimmed)` which handles file rename on disk

### Tag Editing (lines 178–234, 313–355)

- `addTag(raw)` (lines 178–194): normalizes (trim, lowercase, spaces→hyphens), deduplicates, calls `upsertNote` with new tags array, then `saveNote()`
- `removeTag(tagToRemove)` (lines 196–207): filters out tag, `upsertNote` + `saveNote()`
- `showTagInput` boolean state toggles between `<button .addTagBtn>` ("+ tag") and `<input .tagInput>`
- Tag input: Enter commits, Escape cancels, onBlur commits if non-empty
- Tags are `<span .tagPill>` with inline `<button .tagRemove>` (X icon)

### Save Flow (lines 59–98)

- `saveNote()` (lines 59–96): reads `note` from store, gets markdown from TipTap, calls `serializeFrontMatter()` with `{ title, date, tags, properties: note.properties }` (line 75–83), writes via backend, updates store + search index
- `debouncedSave` (line 98): 1500ms debounce on every editor keystroke
- Also saves on window blur (lines 155–164) and beforeunload (lines 167–176)

### Note Loading (lines 100–152)

- `useEffect` on `selectedNoteId.value` change
- Reads file content via backend, calls `parseFrontMatter()` to extract body
- Creates new TipTap editor instance with the body content
- Sets `titleDraft` from `note.title` (line 118)

### Key Observation: Properties Already Flow Through Save

At line 80, `saveNote()` already includes `properties: note.properties` in the frontmatter serialization. This means any changes to `note.properties` in the store are automatically persisted on the next save.

---

## 2. Editor View Styling

**File:** `src/ui/editor-view.module.css`

### Layout Approach

The `.editor` container is a **vertical flexbox** (line 1–7):
```css
.editor { flex: 1; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
```

Children stack: `.header` → `.editorBody` (flex: 1, scrollable) → `.statusBar`

### Spacing Values

| Element | Padding/Margin |
|---------|---------------|
| `.header` | `padding: 1.25rem 3rem 1rem` (line 19) |
| `.titleRow` | `gap: 1rem` (line 26) |
| `.metadata` | `gap: 0.75rem` (line 139) |
| `.tags` | `gap: 0.375rem` (line 147) |
| `.editorBody` | `padding: 0 3rem` (line 224) |
| `.statusBar` | `padding: 0.375rem 3rem` (line 246) |

**Horizontal rhythm:** `3rem` left/right padding is consistent across header, editor body, and status bar.

### Typography

| Element | Font Size | Weight |
|---------|-----------|--------|
| `.titleInput` | `1.875rem` (30px) | `600` |
| `.metadata` | `0.8125rem` (13px) | — |
| `.tagPill` | `0.6875rem` (11px) | `500` |
| `.tagInput` | `0.6875rem` (11px) | — |
| `.addTagBtn` | `0.6875rem` (11px) | — |
| `.statusBar` | `0.6875rem` (11px) | — |
| `.attachBtn` / `.deleteBtn` | `0.75rem` (12px) | — |

### Tag Pill Styling (lines 151–162)

```css
.tagPill {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;          /* fully rounded pill */
  background: var(--color-tag-bg);
  color: var(--color-tag-text);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
}
```

### Tag Remove Button (lines 164–186)

- 14×14px, no border/bg, 50% opacity by default
- Hover: opacity 1, `background: var(--color-accent)`, `color: white`, border-radius: 50%

### Add Tag Button (lines 200–215)

```css
.addTagBtn {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  border: 1px dashed var(--color-border);  /* dashed border = "add" affordance */
  background: none;
  color: var(--color-text-secondary);
}
/* Hover: border-color + color → accent */
```

### Tag Input (lines 188–198)

```css
.tagInput {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  border: 1px solid var(--color-accent);  /* solid accent border when active */
  background: var(--color-bg);
  width: 80px;
}
```

### Button Patterns

Action buttons (attach, delete) at lines 39–76 share a pattern:
- `font-size: 0.75rem`, `padding: 0.25rem 0.75rem`, `border-radius: 6px`
- Default: transparent background, `color: var(--color-text-secondary)`, `border: 1px solid transparent`
- Hover: background/border/color shift to accent (or danger for delete)
- Transition: `color 0.15s ease, background 0.15s ease, border-color 0.15s ease`

---

## 3. Design Tokens & Theme

**File:** `src/index.css`

### Complete Color Palette

#### Light Theme (`:root`, lines 9–31)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#fdfcfa` | Page background |
| `--color-surface` | `#f6f5f1` | Sidebar/panel backgrounds |
| `--color-border` | `#e9e6de` | Borders, dividers |
| `--color-text` | `#1a1a18` | Primary text |
| `--color-text-secondary` | `#94918a` | Muted labels, hints |
| `--color-accent` | `#b8621b` | Primary action color (warm orange) |
| `--color-accent-subtle` | `#fef7f0` | Accent backgrounds (selected states) |
| `--color-accent-hover` | `#a35718` | Darker accent on hover |
| `--color-danger` | `#c24040` | Destructive actions |
| `--color-danger-hover` | `#a83535` | Danger hover state |
| `--color-danger-subtle` | `#fdf0ef` | Danger background |
| `--color-tag-bg` | `#efece4` | Tag pill background |
| `--color-tag-text` | `#6d6a5e` | Tag pill text |
| `--color-backdrop` | `rgba(26,26,24,0.3)` | Modal overlay |
| `--color-scrollbar` | `rgba(180,170,155,0.35)` | Scrollbar track |
| `--color-focus-ring` | `rgba(184,98,27,0.1)` | Focus ring glow |
| `--color-note-hover` | `rgba(253,252,250,0.7)` | List item hover |
| `--color-link-underline` | `rgba(184,98,27,0.4)` | Link underlines |

#### Dark Theme (`[data-theme="dark"]`, lines 47–77)

All tokens overridden with inverted warm tones. Key differences:
- `--color-bg`: `#1c1b1a` (dark warm gray)
- `--color-accent`: `#d4873a` (brighter orange for contrast)
- `--color-tag-bg`: `#33312c`
- `--color-tag-text`: `#b0aa9f`

#### Editor Variables (lines 35–44, 68–76)

Prefixed `--editor-*` for code blocks, syntax highlighting, blockquotes, selections. Not directly relevant to properties UI but establishes the variable naming convention.

### Typography (lines 32–33)

```css
--font-sans: "Iosevka Aile", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
```

### Global Base (lines 79–89)

```css
html, body, #app {
  height: 100%;
  font-family: var(--font-sans);
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.5;
}
```

---

## 4. Note & FrontMatter Types

### Note Interface (`src/notes/note.ts`, lines 1–20)

```typescript
export interface Note {
  id: string;           // YYYYMMDDTHHMMSS or raw filename
  title: string;
  tags: string[];
  properties: Record<string, string>;  // line 9: arbitrary key-value pairs
  filename: string;
  lastModified: number;
  size: number;
  isTimestampFormat: boolean;
  createdAt: Date;
}
```

`properties` is `Record<string, string>` — all values are strings. No typed/structured values.

### FrontMatter Interface (`src/notes/frontmatter.ts`, lines 3–8)

```typescript
export interface FrontMatter {
  title?: string;
  date?: string;
  tags: string[];
  properties: Record<string, string>;
}
```

### parseFrontMatter (`src/notes/frontmatter.ts`, lines 10–63)

Key logic for property parsing at lines 57–59:
```typescript
} else if (key && value) {
  frontMatter.properties[key] = value;
}
```

Any YAML key that is not `title`, `date`, or `tags` with a non-empty value is captured as a property. Keys without values (empty right side of colon) are silently ignored.

**Reserved keys:** `title`, `date`, `tags` — these are handled specially and never end up in `properties`.

**Parser limitations:**
- Only handles single-line `key: value` pairs (no multi-line values, no nested YAML)
- Tag list items (`- item`) are only recognized after `tags:` — no generic list support
- No quoted string handling — values are raw text after the first colon+space
- Keys with colons in the value work because `indexOf(":")` finds the first colon only

### serializeFrontMatter (`src/notes/frontmatter.ts`, lines 66–86)

Serialization order (lines 70–84):
1. `title:` (if defined)
2. `date:` (if defined)
3. Properties: iterated via `Object.entries(frontMatter.properties)` (lines 77–79)
4. `tags:` (always, with list items)

Properties are serialized as plain `key: value\n` lines between date and tags.

### Round-trip Test (`src/notes/frontmatter.test.ts`, lines 180–194)

Confirms that arbitrary properties survive a serialize→parse cycle:
```typescript
properties: { description: "A skill", priority: "high" }
```

---

## 5. Component Patterns

### Three-Column Layout (`src/ui/layout.tsx`)

**File:** `src/ui/layout.tsx`, lines 137–194

Structure:
```
<div .layout>                           <!-- flex row, 100% height -->
  NavSidebar (fixed 220px)              <!-- line 141 -->
  NotesList (resizable via sidebarWidth signal) <!-- line 147 -->
  ResizeHandle                          <!-- line 154–157 -->
  EditorPane (flex: 1)                  <!-- line 160–162 -->
  [optional] ResizeHandle + AgentPanel  <!-- lines 163–172 -->
</div>
```

The EditorView is rendered inside `.editorPane` (line 161) which is `flex: 1` taking remaining space.

### NavSidebar Patterns (`src/ui/nav-sidebar.tsx`)

**Interactive elements pattern:**
- All items are `<button>` elements with `styles.menuItem` base class
- Active state via conditional `styles.menuItemActive` class
- Section headers (`styles.sectionHeader`): flex, 0.6875rem font, uppercase, 0.06em letter-spacing
- Section dividers: 1px `var(--color-border)` line
- Collapsible sections: boolean state + chevron icons

**NavSidebar CSS (`src/ui/nav-sidebar.module.css`):**
- Menu items: `padding: 0.375rem 0.75rem`, `font-size: 0.8125rem`, `border-radius: 6px`
- Active state: `background: var(--color-accent-subtle)`, `color: var(--color-accent)`, `font-weight: 500`
- Hover: `background: var(--color-note-hover)`, `color: var(--color-text)`
- Transition: `0.12s ease` (faster than editor-view's 0.15s)

**Remove button pattern (favorite items, lines 218–241):**
- Absolutely positioned, `opacity: 0` by default
- Parent hover reveals: `.favoriteItem:hover .favoriteRemove { opacity: 1 }`
- Hover color: `var(--color-danger)`, `background: var(--color-danger-subtle)`

### Sidebar / Notes List Patterns (`src/ui/sidebar.tsx`)

**Search input (`src/ui/sidebar.module.css`, lines 37–57):**
```css
.searchInput {
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg);
}
.searchInput:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}
```

This establishes the standard text input pattern: border turns accent on focus, with a 3px focus ring.

### Dialog Pattern (`src/ui/layout.module.css`, lines 37–106)

- Overlay: fixed, `backdrop-filter: blur(4px)`, `var(--color-backdrop)`
- Dialog: `border-radius: 16px`, `padding: 2rem`, `max-width: 360px`, `box-shadow: var(--color-shadow)`
- Cancel button: `border: 1px solid var(--color-border)`, `border-radius: 8px`, `background: var(--color-bg)`
- Confirm button: solid `background: var(--color-danger)`, `color: #fff`

---

## 6. Tag Editor Test Patterns

**File:** `src/ui/tag-editor.test.ts`

This file tests the **data layer** for tag management (not UI rendering). Key patterns that properties should follow:

### Test Helper (lines 14–26)

```typescript
function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    properties: {},  // already included in the factory
    filename: `${overrides.id}.md`,
    lastModified: Date.now(),
    size: 100,
    isTimestampFormat: true,
    createdAt: new Date(2024, 2, 22),
    ...overrides,
  };
}
```

### Data Mutation Pattern

Tags are managed by:
1. Getting current note from store: `getNote(id)`
2. Creating new note object with spread: `{ ...note, tags: [...note.tags, "new-tag"] }`
3. Upserting: `upsertNote(updated)`
4. Triggering save: `saveNote()` in the UI layer

Properties would follow the same pattern:
1. `getNote(id)`
2. `{ ...note, properties: { ...note.properties, newKey: "value" } }`
3. `upsertNote(updated)`
4. `saveNote()`

### Computed Reactivity

Tags drive computed signals (`tagCounts`, `filteredNotes`). Properties don't currently drive any computed signals. If properties need filtering/counting in the future, the pattern is in `src/notes/note-store.ts` (lines 28–49).

---

## 7. Integration Points for Properties UI

### Where the Properties Editor Should Live

Looking at the EditorView structure, the natural location is **inside `.metadata`** (line 312), after the tags and date. The `.metadata` div is a flex row with `align-items: center` and `gap: 0.75rem`.

However, a properties editor with key-value rows would need more vertical space than a single flex row. Options:

**Option A: New section below `.metadata`**
Insert a new `<div .properties>` between the closing `</div>` of `.metadata` (line 363) and the `.editorBody` (line 365). This keeps the header self-contained.

**Option B: Inside `.metadata` as a wrapping flex child**
Less ideal — the metadata bar is designed as a single horizontal row.

### How to Wire Properties Changes

Following the tag pattern in `editor-view.tsx`:

1. **Add property:** Create function similar to `addTag` (line 178). Get note from store, spread existing properties with new key-value, `upsertNote()`, then `saveNote()`.

2. **Remove property:** Create function similar to `removeTag` (line 196). Destructure to omit key, `upsertNote()`, then `saveNote()`.

3. **Edit property value:** Get note, spread properties with updated value, `upsertNote()`, `saveNote()`.

4. **Edit property key:** Remove old key, add new key with same value. Or replace entire properties object.

The `saveNote()` function at line 59 already serializes `note.properties` at line 80, so no changes needed to the save pipeline.

### Reserved Keys to Guard Against

From `parseFrontMatter` (lines 42–56): `title`, `date`, `tags`. The properties editor must prevent users from creating properties with these keys, as they would collide with the reserved frontmatter fields.

### CSS Module to Create/Extend

Either:
- Add new classes to `src/ui/editor-view.module.css` (keeping it co-located)
- Create a new `src/ui/properties-editor.module.css` if extracted to its own component

The codebase pattern is one `.module.css` per component file.

---

## 8. Consistent Patterns Summary

### Interaction Patterns to Follow

| Pattern | Source | How Properties Should Match |
|---------|--------|---------------------------|
| Inline editing | Title input (blur-to-save) | Property values: inline input, blur-to-save |
| Add affordance | "+ tag" dashed-border button | "+ property" dashed-border button |
| Remove affordance | X button on tag pills (opacity reveal) | X button on property rows (opacity reveal) |
| Keyboard shortcuts | Enter to confirm, Escape to cancel (tag input) | Same for property key/value inputs |
| Normalization | Tags: trim, lowercase, spaces→hyphens | Property keys: trim (value: preserve as-is) |
| Immediate save | `upsertNote()` then `saveNote()` | Same |

### Visual Patterns to Follow

| Pattern | Value | Source |
|---------|-------|--------|
| Metadata font size | `0.8125rem` (13px) | `.metadata` |
| Small label font size | `0.6875rem` (11px) | `.tagPill`, `.addTagBtn`, `.statusBar` |
| Pill border-radius | `999px` | `.tagPill`, `.tagInput`, `.addTagBtn` |
| Button border-radius | `6px` | `.attachBtn`, `.menuItem`, `.starBtn` |
| Standard gap | `0.375rem` (tags), `0.75rem` (metadata items), `1rem` (title row) | |
| Horizontal padding | `3rem` | Header, editor body, status bar |
| Transition timing | `0.15s ease` | Editor-view buttons/inputs |
| Secondary text color | `var(--color-text-secondary)` | Labels, dates, muted elements |
| Focus ring | `border-color: var(--color-accent); box-shadow: 0 0 0 3px var(--color-focus-ring)` | `.searchInput:focus` |

### State Management Pattern

- Local UI state (`useState`): for draft values, input visibility toggles
- Store mutation: `getNote(id)` → spread with changes → `upsertNote(newNote)` → `saveNote()`
- No intermediate state management layer — direct signal reads + function calls
