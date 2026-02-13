# UX Design Spec: Favorites in the Sidebar

## Overview

Add a Favorites section to the Noti sidebar so users can pin frequently-accessed notes to the top for one-click access. The design is inspired by Linear's sidebar favorites — compact, collapsible, and low-noise — but adapted for Noti's warm, minimal aesthetic and its existing interaction patterns (no dropdowns, no context menus, cycle-click buttons, keyboard shortcuts).

---

## 1. Sidebar Section Ordering

Favorites slots in **between the search bar and the "All Notes" row**, making it the first content users see after the search field. This matches Linear's placement and gives favorites the visual priority they deserve — they are the notes you reach for most.

### Current sidebar structure

```
┌──────────────────────────────────────┐
│  [Search ................]  (Cmd+K)  │
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
├──────────────────────────────────────┤
│  Tags                                │
│  [work] [personal] [dev]             │
├──────────────────────────────────────┤
│  Today                               │
│    Meeting notes                     │
│    Project plan                      │
│  Yesterday                           │
│    Shopping list                     │
│  ...                                 │
├──────────────────────────────────────┤
│  [☀ Light]                    [🤖 AI]│
└──────────────────────────────────────┘
```

### New sidebar structure with Favorites

```
┌──────────────────────────────────────┐
│  [Search ................]  (Cmd+K)  │
├──────────────────────────────────────┤
│  ▸ FAVORITES (3)                     │  ← NEW: collapsible
│    Weekly standup agenda             │
│    Project roadmap 2025              │
│    Personal journal                  │
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
├──────────────────────────────────────┤
│  Tags                                │
│  [work] [personal] [dev]             │
├──────────────────────────────────────┤
│  Today                               │
│    Meeting notes                     │
│    Project plan                      │
│  ...                                 │
├──────────────────────────────────────┤
│  [☀ Light]                    [🤖 AI]│
└──────────────────────────────────────┘
```

### Placement rationale

- **Above "All Notes"**: Favorites are higher-priority than the full note list. Placing them at the top (after search) means zero scrolling to reach pinned notes. This mirrors Linear, Notion, and Evernote, all of which place favorites/shortcuts above the main content list.
- **Below search**: Search is the universal entry point and should always be first. Favorites are the *second* most common way to navigate.
- **Separate section, not mixed into the note list**: Favorites are a distinct access pattern (pinned, user-ordered) vs. the note list (chronological/sorted). Mixing them would create confusing duplicates or require hiding favorited notes from the main list (which harms discoverability).

### Visibility rules

| Condition | Favorites section behavior |
|---|---|
| 0 favorites | **Hidden entirely** — no section header, no empty state. The sidebar looks exactly like it does today. This avoids showing a hollow section that creates questions before the user has even learned what favorites are. |
| 1+ favorites | Section appears between search and "All Notes" |
| Search is active | **Hidden** — same as how All Notes/Tags/date groups are replaced by search results. Favorites notes will appear in search results naturally. |
| Section collapsed by user | Shows only the header row: `▸ FAVORITES (3)` |

---

## 2. Visual Design

### 2.1 Section Header

The Favorites header uses the same typographic treatment as existing section labels (`.sectionLabel`) — 0.6875rem, 600 weight, uppercase, letter-spaced — but adds a collapse chevron and a count badge.

```
▸ FAVORITES (3)
```

```
ANATOMY:

  ▸        FAVORITES        (3)
  │            │              │
  │            │              └─ Count in parentheses, same
  │            │                 color as label (secondary)
  │            │
  │            └─ Uppercase label, 0.6875rem, weight 600,
  │               color: --color-text-secondary
  │
  └─ Chevron indicator: ▸ when collapsed, ▾ when expanded
     ChevronRight / ChevronDown from Lucide, 10px
     color: --color-text-secondary
```

The entire header row is clickable to toggle collapse (not just the chevron). This is the Linear pattern — large click target, low friction.

#### Header CSS treatment

```css
.favoritesHeader {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-secondary);
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-family: inherit;
  transition: color 0.15s ease;
}

.favoritesHeader:hover {
  color: var(--color-accent);
}
```

### 2.2 Favorite Item Treatment

Favorite items are visually similar to note items in the main list but with key differences to signal their "pinned" status and enable quick removal.

```
FAVORITE ITEM — RESTING STATE:

┌──────────────────────────────────────┐
│ ★  Weekly standup agenda             │
│    #work                             │
└──────────────────────────────────────┘
 │                │
 │                └─ Title: 0.8125rem, weight 500,
 │                   truncated with ellipsis
 │
 └─ Filled star: Star icon from Lucide, 12px
    color: --color-accent (#b8621b)
    Signals "this is favorited"
```

```
FAVORITE ITEM — HOVER STATE:

┌──────────────────────────────────────┐
│ ★  Weekly standup agenda          ✕  │
│    #work                             │
└──────────────────────────────────────┘
 │                                  │
 │                                  └─ X button appears on hover
 │                                     12px, --color-text-secondary
 │                                     hover: --color-danger
 │
 └─ Star remains visible
```

**Design decisions for items:**

- **Filled star prefix**: A small filled star (12px, accent color) appears to the left of the title. This visually distinguishes favorite items from regular note items and reinforces the "favorited" concept. The star is always visible, not just on hover — it's the visual anchor.
- **Tags shown**: Favorite items show tags below the title, just like regular note items. This helps differentiation when you have multiple similarly-named notes.
- **Left border on selected**: When a favorite is the currently-selected note, it gets the same `border-left: 2.5px solid var(--color-accent)` and `background: var(--color-accent-subtle)` treatment as selected notes in the main list. Visual consistency.
- **No duplication indicator**: Favorited notes also appear in the main note list below. No special treatment is needed there — the main list is the canonical sorted view, favorites is the quick-access view. Users of Linear and Notion are accustomed to this pattern.

#### Item CSS

```css
.favoriteItem {
  display: flex;
  align-items: flex-start;
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  padding-left: 0.75rem;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  border-left: 2.5px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
  position: relative;
}

.favoriteItem:hover {
  background: var(--color-note-hover);
}

.favoriteItemSelected {
  background: var(--color-accent-subtle);
  border-left-color: var(--color-accent);
}

.favoriteStar {
  flex-shrink: 0;
  color: var(--color-accent);
  margin-right: 0.5rem;
  margin-top: 0.125rem;
}

.favoriteRemove {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.125rem;
  border-radius: 4px;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.favoriteItem:hover .favoriteRemove {
  opacity: 1;
}

.favoriteRemove:hover {
  color: var(--color-danger);
  background: var(--color-danger-subtle);
}
```

### 2.3 Star Toggle in the Editor Header

A star button in the editor header serves as both indicator and toggle. It sits to the left of the title input, creating a natural "star this note" affordance.

```
EDITOR HEADER — NOTE IS NOT FAVORITED:

┌──────────────────────────────────────────────────────┐
│  ☆ │ Weekly standup agenda           [Attach] [Delete]│
│     │ #work #weekly  [+ tag]          January 15, 2025│
└──────────────────────────────────────────────────────┘
      │
      └─ Empty/outline star: Star icon, 16px
         color: --color-text-secondary
         Clickable — adds to favorites
```

```
EDITOR HEADER — NOTE IS FAVORITED:

┌──────────────────────────────────────────────────────┐
│  ★ │ Weekly standup agenda           [Attach] [Delete]│
│     │ #work #weekly  [+ tag]          January 15, 2025│
└──────────────────────────────────────────────────────┘
      │
      └─ Filled star: Star icon, 16px
         color: --color-accent (#b8621b)
         Clickable — removes from favorites
```

**Rationale for editor-header placement:**
- The star is visible whenever you're reading/editing a note — the exact moment you decide "I want quick access to this."
- It acts as both **indicator** (is this favorited?) and **action** (click to toggle). Same pattern as "like" buttons in every modern app.
- Placing it before the title creates a natural visual flow: `★ Note Title` — the star belongs to the note.
- Alternative considered: star in the sidebar note item on hover. Rejected because it competes with the hover-X on favorite items and adds interaction density to already-compact note items.

#### Star button CSS

```css
.starBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  flex-shrink: 0;
  transition: color 0.15s ease, background 0.15s ease;
}

.starBtn:hover {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}

.starBtnActive {
  color: var(--color-accent);
}

.starBtnActive:hover {
  color: var(--color-danger);
  background: var(--color-danger-subtle);
}
```

Note: when the star is active (favorited), hovering turns it red (danger color) to hint "click to remove." This is a Notion-inspired affordance — the star's hover color communicates the *consequence* of clicking it.

### 2.4 Scaling Behavior: 1, 5, and 15 Favorites

The favorites section must remain usable across different volumes.

#### 1 favorite

```
┌──────────────────────────────────────┐
│  [Search ................]  (Cmd+K)  │
├──────────────────────────────────────┤
│  ▾ FAVORITES (1)                     │
│  ★  Weekly standup agenda            │
│     #work                            │
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
│  ...                                 │
```

Clean and compact. The section occupies minimal space — about 55px total (header + one item). No scrolling impact.

#### 5 favorites

```
┌──────────────────────────────────────┐
│  [Search ................]  (Cmd+K)  │
├──────────────────────────────────────┤
│  ▾ FAVORITES (5)                     │
│  ★  Weekly standup agenda            │
│     #work                            │
│  ★  Project roadmap 2025            │
│     #planning                        │
│  ★  Personal journal                 │
│  ★  API design doc                   │
│     #dev #api                        │
│  ★  Team retro template             │
│     #work #templates                 │
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
│  ...                                 │
```

Five favorites is the sweet spot. The section takes about 200px — comfortable within the sidebar without pushing the main note list too far down. No special handling needed.

#### 15 favorites (overflow case)

When favorites exceed **8 items**, the section shows the first 8 and adds a "Show N more" toggle at the bottom of the list. This prevents the favorites section from dominating the sidebar and pushing the main note list out of view.

```
┌──────────────────────────────────────┐
│  [Search ................]  (Cmd+K)  │
├──────────────────────────────────────┤
│  ▾ FAVORITES (15)                    │
│  ★  Weekly standup agenda            │
│  ★  Project roadmap 2025            │
│  ★  Personal journal                 │
│  ★  API design doc                   │
│  ★  Team retro template             │
│  ★  Bug tracker dashboard           │
│  ★  Meeting notes template          │
│  ★  Quarterly goals                 │
│  ┄┄ Show 7 more ┄┄                  │
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
│  ...                                 │
```

After clicking "Show 7 more":

```
│  ▾ FAVORITES (15)                    │
│  ★  Weekly standup agenda            │
│  ★  Project roadmap 2025            │
│  ...all 15 items...                  │
│  ★  Old reference doc               │
│  ┄┄ Show less ┄┄                    │
```

**Toggle design:**

```css
.favoritesToggle {
  display: block;
  width: 100%;
  padding: 0.375rem 1rem;
  padding-left: 2rem;  /* aligned with item titles */
  font-size: 0.6875rem;
  color: var(--color-text-secondary);
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: color 0.15s ease;
}

.favoritesToggle:hover {
  color: var(--color-accent);
}
```

**Why 8?** At the default 300px sidebar width, 8 favorite items (without tags) consume about 320px — roughly the viewport height of the favorites section before it starts feeling like it *is* the sidebar. The `max-favorites-visible` threshold is a constant, not configurable.

**Collapsed state always shows count:** When the section is collapsed to just the header, the `(15)` count reminds users how many favorites they have without expanding.

---

## 3. Interaction Patterns

### 3.1 Adding a Note to Favorites

There are two ways to add a note to favorites:

#### Method 1: Star button in editor header (primary)

1. User opens a note (clicks in sidebar or navigates via search/link).
2. An outline star `☆` appears to the left of the title input in the editor header.
3. User clicks the star.
4. The star fills and turns accent-orange `★` with a subtle scale animation (transform: scale(1.15) → scale(1), 200ms ease-out).
5. The note appears at the **top** of the Favorites section in the sidebar.
6. If the Favorites section was previously hidden (0 favorites), it appears smoothly.

#### Method 2: Keyboard shortcut (secondary)

1. User has a note selected/open.
2. User presses **Cmd+Shift+F** (Mac) / **Ctrl+Shift+F** (Windows/Linux).
3. Same result as clicking the star: toggles favorite status.

**Shortcut rationale:**
- `Cmd+Shift+F` — "F" for Favorite. The `Shift` modifier avoids conflict with `Cmd+F` (browser find).
- Alternative considered: `Cmd+D` (bookmark in browsers). Rejected because `Cmd+D` is deeply ingrained as "bookmark this page" in Chrome, and intercepting it in a web app feels wrong. Also, some users may expect `Cmd+D` to bookmark the *app URL*, not a note.
- Alternative considered: `Cmd+Shift+S` (star). Rejected because it conflicts with "Save As" conventions.

#### Method NOT provided: right-click on sidebar item

No right-click context menu is provided for adding favorites from the sidebar. Reasoning:
- Noti has no context menus anywhere. The sort spec explicitly rejected menus as a new paradigm.
- Adding a context menu just for "Add to favorites" creates an inconsistency — users would wonder "what else can I right-click?"
- The editor star and keyboard shortcut are sufficient. If the user wants to favorite a note, they select it (one click) and star it (one more click). Two clicks total. A context menu would also be two interactions (right-click → click menu item).

### 3.2 Removing a Note from Favorites

Three removal methods, covering different user contexts:

#### Method 1: Hover X in sidebar favorites (primary for sidebar)

1. User hovers over a favorite item in the sidebar.
2. An `X` button fades in (opacity 0→1, 150ms) on the right side of the item.
3. User clicks X.
4. The item is removed immediately (no confirmation dialog — this is a low-stakes, easily reversible action).
5. If this was the last favorite, the Favorites section disappears.

#### Method 2: Star toggle in editor header (primary for editor)

1. User is viewing a favorited note.
2. The star in the editor header is filled/orange `★`.
3. On hover, the star turns red (danger color) to hint "click to remove."
4. User clicks the star.
5. Star returns to outline state `☆`. Note is removed from favorites.

#### Method 3: Keyboard shortcut

1. Same `Cmd+Shift+F` shortcut toggles — if the note is already favorited, it unfavorites.

**No confirmation dialog for removal.** Removing a favorite is low-stakes:
- The note itself is not deleted, just unpinned.
- The action is trivially reversible (click star again or Cmd+Shift+F).
- Adding a dialog for every unfavorite would create friction that discourages using favorites at all.

### 3.3 Reordering Favorites

#### Phase 1 (initial release): No manual reorder

Favorites are ordered by **time favorited**, most recently favorited at the top. This is simple, predictable, and requires zero additional UI.

**Rationale for deferring drag-and-drop reorder:**
- Drag-and-drop requires significant implementation: drag handles, drop zones, visual feedback, insertion indicators, touch support, accessibility (keyboard reorder).
- Noti currently has zero drag-and-drop anywhere. Introducing it for a single feature is a large paradigm addition.
- "Most recently favorited at top" is a reasonable default — the note you just pinned is likely the one you want fastest access to.
- Users who want a specific note at the top can unfavorite and re-favorite it.

#### Phase 2 (future): Drag-and-drop reorder

If user feedback shows strong demand, drag-and-drop can be added later with:
- A grip handle (⠿ icon) that appears on hover, to the left of the star.
- Drop zone indicators between items.
- Keyboard reorder via Alt+Arrow Up/Down when a favorite is focused.
- Persistence of custom order in the favorites data file.

This spec does **not** design the Phase 2 UX in detail. It's called out here so the data model accommodates a manual `order` field from day one.

### 3.4 Navigating to a Favorited Note

Clicking a favorite item in the sidebar navigates to that note, exactly like clicking a note in the main list:
1. `selectedNoteId` signal updates to the favorite note's ID.
2. The editor loads the note content.
3. The clicked favorite item shows the selected state (left border + accent background).
4. The same note is also highlighted in the main note list below (since it appears in both places).

### 3.5 Collapsing the Favorites Section

1. User clicks anywhere on the "FAVORITES (N)" header row.
2. The chevron rotates from ▾ (down/expanded) to ▸ (right/collapsed).
3. The favorite items slide up and are hidden (or simply display:none — no animation needed for v1).
4. The collapsed state is persisted to localStorage so it survives page reloads.
5. Clicking the header again expands the section.

**Keyboard:** When the header is focused, Enter/Space toggles collapse.

---

## 4. ASCII Wireframes: Full Sidebar States

### 4.1 No Favorites (default state, new user)

```
┌──────────────────────────────────────┐
│                                      │
│  [Search notes...         ]  (Cmd+K) │
│                                      │
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
├──────────────────────────────────────┤
│  Tags                                │
│  [work] [personal] [dev]             │
├──────────────────────────────────────┤
│                                      │
│  Today                               │
│  ┊ Meeting notes                     │
│  ┊ Project plan                      │
│  Yesterday                           │
│  ┊ Shopping list                     │
│  ┊ Travel itinerary                  │
│  This Week                           │
│  ┊ Book recommendations              │
│  ┊ Recipe collection                 │
│                                      │
│  ...                                 │
│                                      │
├──────────────────────────────────────┤
│  [☀ Light]                    [🤖 AI]│
└──────────────────────────────────────┘

→ No favorites section visible.
→ Sidebar is identical to today.
```

### 4.2 One Favorite, Expanded

```
┌──────────────────────────────────────┐
│                                      │
│  [Search notes...         ]  (Cmd+K) │
│                                      │
├──────────────────────────────────────┤
│  ▾ FAVORITES (1)                     │
│  ★  Weekly standup agenda            │
│     #work                            │
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
├──────────────────────────────────────┤
│  Tags                                │
│  [work] [personal] [dev]             │
├──────────────────────────────────────┤
│                                      │
│  Today                               │
│  ┊ Meeting notes                     │
│  ┊ Weekly standup agenda             │  ← also in main list
│  ┊ Project plan                      │
│  ...                                 │
│                                      │
├──────────────────────────────────────┤
│  [☀ Light]                    [🤖 AI]│
└──────────────────────────────────────┘
```

### 4.3 Five Favorites, One Selected, One Hovered

```
┌──────────────────────────────────────┐
│                                      │
│  [Search notes...         ]  (Cmd+K) │
│                                      │
├──────────────────────────────────────┤
│  ▾ FAVORITES (5)                     │
│  ★  Weekly standup agenda            │
│     #work                            │
│▌ ★  Project roadmap 2025 ◄──────────│──── selected (left border
│     #planning                        │     + accent bg)
│  ★  Personal journal      ··········│···· hovered (hover bg +
│                            [✕]·······│···· X button visible)
│  ★  API design doc                   │
│     #dev #api                        │
│  ★  Team retro template             │
│     #work #templates                 │
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
│  ...                                 │
```

### 4.4 Favorites Collapsed

```
┌──────────────────────────────────────┐
│                                      │
│  [Search notes...         ]  (Cmd+K) │
│                                      │
├──────────────────────────────────────┤
│  ▸ FAVORITES (5)                     │  ← collapsed, count visible
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
├──────────────────────────────────────┤
│  Tags                                │
│  [work] [personal] [dev]             │
├──────────────────────────────────────┤
│  Today                               │
│  ┊ ...more note list space...        │
│                                      │
├──────────────────────────────────────┤
│  [☀ Light]                    [🤖 AI]│
└──────────────────────────────────────┘

→ One line for the header. Maximum space for notes.
→ Count badge reminds user they have favorites.
```

### 4.5 Overflow: 15 Favorites (8 shown + toggle)

```
┌──────────────────────────────────────┐
│                                      │
│  [Search notes...         ]  (Cmd+K) │
│                                      │
├──────────────────────────────────────┤
│  ▾ FAVORITES (15)                    │
│  ★  Weekly standup agenda            │
│  ★  Project roadmap 2025            │
│  ★  Personal journal                 │
│  ★  API design doc                   │
│  ★  Team retro template             │
│  ★  Bug tracker dashboard           │
│  ★  Meeting notes template          │
│  ★  Quarterly goals                 │
│     ┄┄ Show 7 more ┄┄               │  ← subtle toggle
├──────────────────────────────────────┤
│  ALL NOTES (42)           [sort] [+] │
│  ...                                 │
```

### 4.6 Editor Header with Star Button

```
NOT FAVORITED:
┌──────────────────────────────────────────────────────────┐
│  ☆  │  Weekly standup agenda            [📎 Attach] [Delete]│
│     │  #work #weekly  [+ tag]                Jan 15, 2025│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Editor content here...                                  │
│                                                          │

FAVORITED:
┌──────────────────────────────────────────────────────────┐
│  ★  │  Weekly standup agenda            [📎 Attach] [Delete]│
│     │  #work #weekly  [+ tag]                Jan 15, 2025│
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Editor content here...                                  │
│                                                          │

FAVORITED, STAR HOVERED (hint: "click to remove"):
┌──────────────────────────────────────────────────────────┐
│  ★  │  Weekly standup agenda            [📎 Attach] [Delete]│
│  ↑  │  #work #weekly  [+ tag]                Jan 15, 2025│
│  red                                                     │
```

### 4.7 Search Active (Favorites Hidden)

```
┌──────────────────────────────────────┐
│                                      │
│  [meeting notes______] [✕]  (Cmd+K) │
│                                      │
├──────────────────────────────────────┤
│  3 RESULTS                           │  ← favorites section hidden
│  ┊ Meeting notes                     │     during search, as are
│  ┊ Q4 meeting summary               │     All Notes, Tags, etc.
│  ┊ Weekly standup agenda             │
│                                      │
├──────────────────────────────────────┤
│  [☀ Light]                    [🤖 AI]│
└──────────────────────────────────────┘
```

---

## 5. State Transitions & Animations

### 5.1 Adding First Favorite (section appears)

```
BEFORE:                          AFTER:
┌─────────────────────┐          ┌─────────────────────┐
│  [Search...]        │          │  [Search...]        │
├─────────────────────┤          ├─────────────────────┤
│  ALL NOTES (42)     │    →     │  ▾ FAVORITES (1)    │  ← slides in
                                 │  ★  My note         │
                                 ├─────────────────────┤
                                 │  ALL NOTES (42)     │
```

The favorites section appears with a simple opacity+translate animation: `opacity: 0, translateY(-8px)` → `opacity: 1, translateY(0)` over 200ms ease-out. This is subtle and avoids jarring layout shifts.

### 5.2 Removing Last Favorite (section disappears)

Reverse of above. The section fades out: `opacity: 1` → `opacity: 0` over 150ms, then `display: none`. The "All Notes" section slides up to fill the space.

### 5.3 Star Toggle Animation

When clicking the star in the editor header:
- **Favoriting**: Star scales `1.0 → 1.2 → 1.0` over 250ms with ease-out. Color transitions from secondary → accent simultaneously.
- **Unfavoriting**: No scale animation — just a color transition from accent → secondary over 150ms. The removal should feel instant and low-ceremony.

---

## 6. Keyboard Shortcuts & Accessibility

### 6.1 Keyboard Shortcuts

| Shortcut | Context | Action |
|---|---|---|
| `Cmd+Shift+F` / `Ctrl+Shift+F` | Any (note must be selected) | Toggle favorite status of current note |

No additional shortcuts for navigating favorites — the existing tab order and arrow keys suffice.

### 6.2 Focus Order

The favorites section inserts into the existing tab order:

```
1. Search input
2. Favorites header button          ← NEW
3. Favorite items (if expanded)     ← NEW
4. "All Notes" button
5. Sort button
6. "+" new note button
7. Tag filters
8. Note list items
9. Theme toggle
10. AI toggle
```

### 6.3 ARIA Markup

#### Favorites section

```html
<section aria-label="Favorites">
  <button
    class="favoritesHeader"
    aria-expanded="true"
    aria-controls="favorites-list"
  >
    <ChevronDown size={10} />
    Favorites (3)
  </button>
  <div id="favorites-list" role="list" aria-label="Favorited notes">
    <button role="listitem" aria-label="Weekly standup agenda, favorited">
      ...
    </button>
  </div>
</section>
```

#### Star button in editor

```html
<button
  class="starBtn"
  aria-label="Add to favorites"
  aria-pressed="false"
  title="Add to favorites (Cmd+Shift+F)"
>
  <Star size={16} />
</button>
```

When favorited:
```html
<button
  class="starBtn starBtnActive"
  aria-label="Remove from favorites"
  aria-pressed="true"
  title="Remove from favorites (Cmd+Shift+F)"
>
  <Star size={16} fill="currentColor" />
</button>
```

The `aria-pressed` attribute communicates the toggle state to screen readers. The `aria-label` changes to describe the *action* (what clicking will do), not the current state.

### 6.4 Keyboard Interactions on Favorite Items

| Key | Context | Action |
|---|---|---|
| `Enter` / `Space` | Favorite item focused | Navigate to the note |
| `Delete` / `Backspace` | Favorite item focused | Remove from favorites |
| `Enter` / `Space` | Favorites header focused | Toggle section collapse |
| `Tab` | Within favorites | Move to next favorite item |
| `Shift+Tab` | Within favorites | Move to previous item |

The `Delete`/`Backspace` shortcut on focused favorites provides a keyboard-accessible removal path that doesn't require hovering for the X button.

---

## 7. Edge Cases

### 7.1 Favorited Note Is Deleted

When a note that exists in favorites is deleted (via the editor's Delete button + confirmation dialog):

1. The note is removed from both the note store and the favorites list simultaneously.
2. No ghost state, no "missing note" placeholder — it simply disappears from favorites.
3. The favorites count updates.
4. If it was the last favorite, the section disappears.

**Rationale:** A deleted note is gone. Showing a ghost/placeholder would confuse users ("why is there a broken favorite?") and require additional UI to handle. The deletion confirmation dialog already warns the user — they made a conscious choice.

### 7.2 Favorited Note Is Renamed

When a favorited note's title changes (via the title input in the editor):

1. The favorite item's title updates in real-time (it reads from the same `notesMap` signal).
2. No additional action needed — the favorite stores the note *ID*, not the title.
3. The note ID is immutable (timestamp from filename), so renames never break the favorite reference.

### 7.3 Favorites Data File Is Corrupted or Missing

The favorites list is persisted to a local file (see architecture spec for details). If the file is missing or unparseable:

1. Treat as "no favorites" — show empty state (no section visible).
2. Do not show an error message. The user likely doesn't know or care about the data file.
3. As soon as the user adds a favorite, a fresh file is created.
4. If the file is partially parseable (some valid IDs, some garbage), keep the valid entries and silently discard the invalid ones.

### 7.4 Favorite References a Non-Existent Note ID

This can happen if:
- The user manually deletes a `.md` file from their folder outside the app.
- The favorites file was synced from another device with different notes (if sync is ever added).

Behavior: **Silently skip non-existent IDs.** The favorite entry remains in the data file (in case the note reappears, e.g. file sync completes), but it is not rendered in the sidebar. The count only reflects visible favorites.

On the next write to the favorites file (e.g., adding/removing another favorite), invalid entries are pruned.

### 7.5 Very Long Note Title in Favorites

Titles are truncated with `text-overflow: ellipsis`, same as the main note list. At 300px sidebar width minus padding and star icon, there's about 220px available for the title — roughly 35-40 characters at 0.8125rem before truncation. This matches the existing note list behavior.

### 7.6 Duplicate Favorite (same note favorited twice)

Impossible by design — the favorite toggle is idempotent. Clicking the star when already favorited removes, not duplicates. The data model uses a set/list of unique note IDs.

### 7.7 Rapid Toggle (click star quickly multiple times)

Each click toggles the state. Rapid clicking results in the note flickering in/out of favorites. To prevent data inconsistency, the toggle function should be synchronous on the signal and debounce the file write (same pattern as note saving — debounce 500ms).

---

## 8. Discoverability

How do users learn about favorites?

### 8.1 The Star is Self-Explanatory

The outline star `☆` in the editor header is a universally recognized UI pattern. Users from Gmail, Notion, GitHub, Slack, Twitter/X, and virtually every modern app understand "click star to save/pin."

### 8.2 Tooltip on Hover

The star button shows a tooltip: `"Add to favorites (Cmd+Shift+F)"`. This teaches both the feature and the shortcut.

### 8.3 No Onboarding Tooltip or Tutorial

Favorites does not warrant an onboarding overlay or tooltip tour. It's a standard pattern that users discover organically. Adding a tutorial for such a simple feature would feel patronizing and add implementation complexity.

### 8.4 The Section Appearing is the Teaching Moment

When a user stars their first note and sees the "FAVORITES (1)" section appear in the sidebar with their note in it, the feature is fully self-taught. The connection between "I clicked the star" → "it appeared in the sidebar" is immediate and clear.

---

## 9. Summary of Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Section placement | Between search and "All Notes" | Highest visibility, matches Linear/Notion |
| Add method | Star in editor header + Cmd+Shift+F | Universally understood, works when editing |
| Remove method | Hover X in sidebar + star toggle + Delete key | Multiple paths for different contexts |
| Reorder | Time-favorited order (most recent on top), no drag for v1 | Simplest model, avoids new paradigm (no D&D exists in app) |
| Collapsible | Yes, click header to toggle | Lets power users reclaim space |
| Empty state | Hide section entirely | No phantom section for new users |
| Overflow (>8) | "Show N more" toggle | Prevents favorites from dominating sidebar |
| No context menu | Deliberate omission | Noti has no context menus anywhere, keeps minimal |
| Animation | Minimal — opacity transitions, subtle star scale | Warm but not distracting. Matches existing 0.15s ease transitions |
| Deleted favorite | Silent removal | Low ceremony, note is already gone |
| Corrupted data | Treat as empty, rebuild silently | Resilient, no scary errors |
| Star hover color when active | Danger red | Communicates "click to remove" consequence |
| Tags on favorite items | Shown | Helps differentiate similar titles |
