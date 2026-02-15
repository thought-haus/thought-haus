# UX Design Spec: Sidebar Sort Options

## Overview

Add sort controls to the Thought.Haus sidebar so users can order notes by Date Created (default, desc), Title (A-Z), or Last Modified. The design must feel native to Thought.Haus's warm, minimal aesthetic and fit comfortably inside the 300px sidebar.

---

## 1. Control Placement

The sort control goes **on the `sectionRow`**, to the left of the existing `newNoteBtn` (+). It sits between the "All Notes (N)" label and the "+" button.

**Current layout of `.sectionRow`:**
```
[ All Notes (42)                          [+] ]
```

**New layout:**
```
[ All Notes (42)                   [sort] [+] ]
```

**Reasoning:**
- The section row already has `justify-content: space-between` with the "All Notes" label on the left and action buttons on the right. Adding a sort button next to the "+" button groups all note-list actions together.
- Placing it here means the control is always visible when browsing notes, without consuming any additional vertical space.
- It's adjacent to the note list it controls, making the relationship self-evident.

---

## 2. Control Type: Cycle-Click Button

**Chosen approach: A single cycle-click button** that cycles through sort modes on click, identical to the ThemeToggle pattern already used in the sidebar footer.

**Rejected alternatives:**
- **Dropdown menu:** No dropdowns or popovers exist anywhere in Thought.Haus. Introducing one breaks the pattern. Dropdowns also require dismiss-on-outside-click logic, focus trapping, and more DOM complexity for only 3 options.
- **Segmented control:** Three segments ("Date", "Title", "Modified") at 0.6875rem each would consume ~150px+ of the 300px sidebar. Too wide for the section row.
- **Multiple icon buttons:** Three separate icons would be visually noisy and hard to differentiate at 14px. It also breaks the established pattern of one-action-per-button.

**Cycle-click justification:**
- Matches the exact ThemeToggle interaction: click cycles through `created` -> `title` -> `modified` -> `created`.
- Compact: one 26px button in the section row.
- Users already understand this pattern from the theme toggle.
- Direction toggle is a secondary action (see below).

---

## 3. Visual Design

### 3.1 Sort Button (`.sortBtn`)

Styled identically to `.newNoteBtn` for visual consistency in the section row:

```css
.sortBtn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  cursor: pointer;
  color: var(--color-text-secondary);
  line-height: 1;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.sortBtn:hover {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.sortBtn:focus-visible {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
  outline: none;
}
```

**Active state** (when a non-default sort is active):
```css
.sortBtnActive {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background: var(--color-accent-subtle);
}
```

This uses the same accent treatment as `.allNotesBtnActive` and `.tagFilterActive` — when the user has changed from the default sort, the button glows warm orange so they know a non-default sort is applied.

### 3.2 Sort Icon

A 14x14 SVG icon that changes per sort mode. All icons use `stroke="currentColor"` and `stroke-width="2"` to match existing sidebar icons (ThemeToggle, AI toggle).

| Sort Mode | Icon | Description |
|---|---|---|
| **Date Created** (default) | Clock/calendar | Small clock icon — conveys time-based ordering |
| **Title** | A-Z bars | Horizontal lines descending with "A" hint — conveys alphabetical |
| **Last Modified** | Pencil-clock | Small edit/pencil mark — conveys "recently edited" |

Each icon includes a small directional indicator: a tiny chevron (3px) in the bottom-right corner of the icon area pointing up (ascending) or down (descending). This is subtle but learnable.

### 3.3 Sort Direction Indicator

The directional chevron integrated into the icon area:
- **Descending (default for dates):** `v` chevron (pointing down, newest first)
- **Ascending:** `^` chevron (pointing up, oldest first / A-Z)

The chevron is rendered as part of the SVG, 4px tall, positioned bottom-right within the 14x14 viewbox.

---

## 4. Interaction Flow

### 4.1 Discovering Sort

1. User sees a small icon button to the left of the "+" button in the section row.
2. On hover, a native `title` tooltip appears: "Sort: Date created (newest first)" — explains the current state clearly.
3. The button is visually muted (secondary color, matching "+") when on default sort, drawing minimal attention.

### 4.2 Changing Sort Mode (Left Click)

1. **Click** the sort button to cycle to the next sort mode:
   - Date Created -> Title -> Last Modified -> Date Created
2. Each click:
   - The icon smoothly transitions (0.15s ease via color transition)
   - The tooltip updates to reflect the new sort
   - The note list re-sorts immediately
   - Date group headers update to match the new sort context (see Section 7)
3. When sort is anything other than the default (Date Created, desc), the button enters active state (warm orange accent).

### 4.3 Toggling Sort Direction (Right Click / Long Press)

1. **Right-click** (contextmenu event) on the sort button toggles ascending/descending.
2. `e.preventDefault()` suppresses the browser context menu.
3. The directional chevron in the icon flips.
4. The tooltip updates: e.g. "Sort: Title (Z-A)" -> "Sort: Title (A-Z)".
5. The note list re-sorts immediately.

**Why right-click for direction:**
- Left-click for mode, right-click for direction keeps the control to a single button.
- The direction toggle is a less frequent action — most users want newest-first or A-Z and rarely toggle.
- Alternative considered: Shift+click for direction. This is acceptable as a secondary binding, but right-click is more discoverable via tooltip hint.

**Tooltip hint for direction toggle:**
The tooltip should include a parenthetical hint: `"Sort: Title (A-Z) · Right-click to reverse"`

### 4.4 Visual Feedback

| Action | Feedback |
|---|---|
| Hover | Background: `--color-accent-subtle`, color: `--color-accent`, border: `--color-accent` |
| Click (mode change) | Icon changes, list re-sorts, button flashes active state briefly |
| Right-click (direction) | Chevron flips, list re-sorts |
| Non-default sort active | Button border and icon stay `--color-accent` (warm orange) persistently |
| Return to default | Button returns to muted `--color-text-secondary` state |

---

## 5. Sort Indicator

The user knows which sort is active through three signals:

1. **Icon identity**: Clock = date created, A-Z bars = title, pencil = last modified. Each sort mode has a distinct icon silhouette.
2. **Directional chevron**: Tiny `^` or `v` in the icon shows asc/desc.
3. **Active state color**: Non-default sort turns the button orange (`--color-accent`), same visual language as active tag filter.
4. **Tooltip**: Full description of current sort on hover (e.g., "Sort: Last modified (newest first) · Right-click to reverse").

---

## 6. Context Behavior

### 6.1 When Search Is Active

- The sort button is **hidden** when search is active (`isSearchActive === true`).
- Search results have their own relevance-based ranking from MiniSearch. Allowing the user to re-sort search results would conflict with relevance scoring and add confusion.
- The entire section row (All Notes + sort + new note) is already replaced by the search results header ("N results"), so hiding the sort button is natural.
- When search is cleared, the sort button reappears with the previously selected sort still active.

### 6.2 When Tag Filter Is Active

- The sort button **remains visible and functional** when a tag filter is active.
- Filtering by tag reduces the note set but doesn't change the desired ordering. Users should be able to filter by "work" tag and then sort by title.
- The "All Notes (N)" label already updates its count to reflect the filtered set. No additional changes needed for the sort control.
- Both active states (tag filter orange pill + sort button orange) can coexist. They serve different purposes and use different visual shapes (pill vs. square icon button).

---

## 7. Date Grouping Adaptation

The sidebar groups notes under date headers ("Today", "Yesterday", "This Week", etc.). This grouping must adapt to the active sort mode.

| Sort Mode | Grouping Behavior |
|---|---|
| **Date Created** (default) | Groups by creation date: "Today", "Yesterday", "This Week", "This Month", "Older". Uses `note.createdAt`. Current behavior, unchanged. |
| **Last Modified** | Groups by modification date: "Modified Today", "Modified Yesterday", "Modified This Week", "Modified This Month", "Modified Earlier". Uses `note.lastModified`. Prefix "Modified" disambiguates from creation date groups. |
| **Title (A-Z / Z-A)** | **No date groups.** Display a flat list with no group headers. Alphabetical grouping (A, B, C...) was considered but adds visual noise for little benefit — the alphabetical order is self-evident from reading titles. |

### Implementation note

The `getDateGroup()` function is called in the `grouped` computed signal inside Sidebar. The sort mode signal should be checked there:
- If sort mode is `"title"`, skip grouping entirely (return one flat group or no groups).
- If sort mode is `"modified"`, call `getDateGroup()` with `new Date(note.lastModified)` and prefix labels.
- If sort mode is `"created"`, call `getDateGroup()` with `note.createdAt` (current behavior).

---

## 8. Keyboard Accessibility

### Focus Order

The sort button is a `<button>` element and participates in the natural tab order. The tab sequence through the section row is:

1. Search input
2. "All Notes" button
3. **Sort button** (new)
4. "+" new note button
5. Tag filters (if present)
6. Note list items

### Keyboard Interactions

| Key | Context | Action |
|---|---|---|
| `Enter` or `Space` | Sort button focused | Cycle to next sort mode (same as left-click) |
| `Shift+Enter` or `Shift+Space` | Sort button focused | Toggle sort direction (same as right-click) |
| `Tab` | Sort button focused | Move focus to "+" button |
| `Shift+Tab` | Sort button focused | Move focus back to "All Notes" button |

### ARIA

```html
<button
  class="sortBtn"
  aria-label="Sort notes by date created, newest first. Press to change sort, Shift to reverse direction."
  title="Sort: Date created (newest first) · Right-click to reverse"
>
```

The `aria-label` provides full context for screen readers. It updates dynamically with the current sort mode and direction.

---

## 9. Responsive Behavior

The sidebar is fixed at `--sidebar-width: 300px`. The section row has:
- Left: "All Notes (NN)" — variable width, truncates with ellipsis if needed
- Right: Sort button (26px) + 6px gap + New note button (26px) = ~58px fixed

At 300px with `padding: 0.5rem 1rem` (32px total horizontal padding), there is **210px** available for the "All Notes" label. Even "All Notes (999)" at 0.6875rem fits comfortably. No responsive breakpoints or overflow handling are needed.

If the sidebar were ever made narrower (not currently supported), the "All Notes" label would truncate via `text-overflow: ellipsis` before the buttons compress. The two 26px buttons are the minimum fixed elements.

---

## 10. Rough Markup Structure

### HTML Structure (JSX)

```tsx
{/* Inside the non-search branch of the Sidebar */}
<div class={styles.section}>
  <div class={styles.sectionRow}>
    <button
      class={`${styles.sectionHeader} ${styles.allNotesBtn} ${!activeTag ? styles.allNotesBtnActive : ""}`}
      onClick={() => (activeTagFilter.value = null)}
    >
      All Notes ({count})
    </button>
    <div class={styles.sectionActions}>
      <button
        class={`${styles.sortBtn} ${sortMode !== "created" || sortDirection !== "desc" ? styles.sortBtnActive : ""}`}
        onClick={cycleSort}
        onContextMenu={toggleDirection}
        title={sortTooltip}
        aria-label={sortAriaLabel}
      >
        {/* 14x14 SVG icon, changes per sortMode */}
        {/* Includes directional chevron */}
      </button>
      <button
        class={styles.newNoteBtn}
        onClick={onNewNote}
        title="New note (Cmd/Ctrl+N)"
        aria-label="New note"
      >
        +
      </button>
    </div>
  </div>
</div>
```

### New CSS Classes

```css
/* Container for sort + new note buttons */
.sectionActions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Sort button — mirrors .newNoteBtn dimensions */
.sortBtn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg);
  cursor: pointer;
  color: var(--color-text-secondary);
  line-height: 1;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.sortBtn:hover {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
  border-color: var(--color-accent);
}

.sortBtn:focus-visible {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
  outline: none;
}

/* When non-default sort is active */
.sortBtnActive {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background: var(--color-accent-subtle);
}
```

### Sort State Signal

```ts
// In a new file or in app-state.ts:
type SortMode = "created" | "title" | "modified";
type SortDirection = "asc" | "desc";

// Default: newest created first
const sortMode = signal<SortMode>("created");
const sortDirection = signal<SortDirection>("desc");
```

### Cycle Logic

```ts
const SORT_CYCLE: SortMode[] = ["created", "title", "modified"];

function cycleSort() {
  const current = sortMode.value;
  const nextIndex = (SORT_CYCLE.indexOf(current) + 1) % SORT_CYCLE.length;
  const next = SORT_CYCLE[nextIndex];
  sortMode.value = next;
  // Reset direction to the natural default for each mode:
  // dates default desc (newest first), title defaults asc (A-Z)
  sortDirection.value = next === "title" ? "asc" : "desc";
}

function toggleDirection(e: MouseEvent) {
  e.preventDefault();
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
}
```

### Tooltip Strings

```ts
const SORT_LABELS: Record<SortMode, string> = {
  created: "Date created",
  title: "Title",
  modified: "Last modified",
};

const DIRECTION_LABELS: Record<SortMode, Record<SortDirection, string>> = {
  created: { desc: "newest first", asc: "oldest first" },
  title: { asc: "A-Z", desc: "Z-A" },
  modified: { desc: "newest first", asc: "oldest first" },
};

const sortTooltip = computed(() => {
  const mode = sortMode.value;
  const dir = sortDirection.value;
  return `Sort: ${SORT_LABELS[mode]} (${DIRECTION_LABELS[mode][dir]}) · Right-click to reverse`;
});
```

---

## Summary of Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Control type | Cycle-click button | Matches ThemeToggle pattern, compact, no new interaction paradigms |
| Placement | Section row, left of "+" button | Groups actions together, no extra vertical space |
| Direction toggle | Right-click / Shift+Enter | Keeps single-button simplicity, direction is secondary action |
| Active indicator | Accent color on button | Matches tag filter active state visual language |
| Search behavior | Hide sort button | Search has own relevance ranking |
| Tag filter behavior | Sort stays visible | Filtering and sorting are independent concerns |
| Title sort grouping | No groups | Alphabetical order is self-evident from titles |
| Modified sort groups | Prefixed labels | "Modified Today" disambiguates from creation date |
