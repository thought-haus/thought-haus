# Properties UX Research: Obsidian & Linear

> Research document cataloging visual design and interaction patterns from Obsidian's Properties feature and Linear's metadata system, intended to inform a Thought.Haus properties UX spec.

---

## 1. Obsidian Properties (Primary Inspiration)

### 1.1 Overview

Obsidian introduced Properties in v1.4 (August 2023) as a visual UI layer over YAML frontmatter. Properties allow users to add structured metadata (tags, links, dates, numbers, checkboxes) to the top of notes without manually writing YAML. The underlying storage remains plain-text YAML frontmatter delimited by `---`, making it portable and future-proof.

**Key design philosophy**: Make structured metadata visually accessible and easy to edit, while keeping the underlying data format simple, portable, and human-readable.

### 1.2 Visual Design

#### Layout

Properties appear as a **dedicated section at the very top of the note**, above the note title/content. The section is visually distinct from the note body:

- **Container**: The `.metadata-container` wraps the entire properties section. It sits flush at the top of the editor area, visually separated from the note content below it. The container has subtle padding (`--metadata-padding`) and a gap between rows (`--metadata-gap`).
- **Heading row**: A collapsible "Properties" heading (`.metadata-properties-heading`) sits at the top. Clicking it collapses/expands the section. A small disclosure triangle indicates fold state.
- **Property rows**: Each property is a horizontal row with two parts:
  - **Left side**: A type icon (`.metadata-property-icon`) followed by the property name/key (`.metadata-property-key`). The key has a fixed label width (`--metadata-label-width`).
  - **Right side**: The property value input, which varies by type (text field, number input, checkbox, date picker, list of tags, etc.). The input font size is configurable (`--metadata-input-font-size`).
- **"Add property" button**: A `+ Add property` button (`.metadata-add-button`) sits at the bottom of the properties section. It's always visible when properties are expanded.

#### Typography & Color

- Property keys use a muted/secondary text color (`--metadata-label-text-color`) and configurable font weight (`--metadata-label-font-weight`) and size (`--metadata-label-font-size`).
- Property values use the standard editor text color and size.
- The type icons use the standard icon color (`--icon-color`) at a configurable size (`--icon-size`).
- The overall aesthetic is minimal — no heavy borders or backgrounds. The properties section flows naturally as part of the note content.

#### Display Modes

Three configuration options (Settings → Editor → Properties in document):

| Mode | Behavior |
|------|----------|
| **Visible** (default) | Properties appear formatted at the top of the note in the editor |
| **Hidden** | Properties are excluded from the editor view but visible in a sidebar panel |
| **Source** | Displays raw YAML frontmatter text (no visual UI) |

### 1.3 Property Type System

Properties are typed globally — once a property name is assigned a type, **all properties with that name across the entire vault share the same type**. This enforces consistency.

| Type | Icon | Input Behavior | Display in Live Preview |
|------|------|----------------|------------------------|
| **Text** | `T` or text icon | Single-line text input | Plain text |
| **List** | List icon | Multi-value input, each value on its own line (hyphen-space prefix in YAML) | Comma-separated or tag-pill list |
| **Number** | `#` or number icon | Numeric-only input (integers and decimals) | Plain number |
| **Checkbox** | Checkbox icon | Boolean toggle | Interactive checkbox |
| **Date** | Calendar icon | Date picker (ISO 8601: `YYYY-MM-DD`) | Interactive date that links to daily notes |
| **Date & Time** | Clock icon | Date + time picker (ISO 8601 with time component) | Date and time display |
| **Tags** | Tag icon | Multi-value tag input with autocomplete | Functionally equivalent to inline `#tags` |

**Special/default properties:**
- `tags` — hierarchical categorization (forward-slash notation, e.g., `project/active`)
- `aliases` — alternative names for a note (appear in link suggestions and search)
- `cssclasses` — CSS class names for per-note styling

### 1.4 Interaction Patterns

#### Adding a Property

1. **Via button**: Click the `+ Add property` button at the bottom of the properties section. A new empty row appears.
2. **Via command**: Use the keyboard shortcut `Cmd/Ctrl + ;` (mapped to the "Add file property" command). A new row appears with the property name input focused.
3. **Via menu**: Use the three-dot "More actions" menu on the note tab → "Add file property". Or right-click the note tab.
4. **Via manual YAML**: Type `---` at the very top of the file in Source mode to begin writing frontmatter manually.

**The add flow:**
- A new empty row appears at the bottom of the properties list.
- The property name input is focused and shows an **autocomplete dropdown** suggesting existing property names from the vault. This is the key consistency mechanism — it nudges users toward reusing existing property names rather than creating slight variations.
- After selecting or typing a name, pressing `Tab` moves focus to the value input.
- The value input type is determined by the property's global type (or defaults to text for new names).
- For certain value types (like tags or list items), the value input also shows autocomplete suggestions based on existing values across the vault.

#### Editing a Property Value

- **Click to edit**: Click on any property value to enter edit mode. The field becomes an active input.
- **Type-specific affordances**:
  - Text: Simple text input
  - Number: Numeric input (rejects non-numeric characters)
  - Checkbox: Single click toggles the boolean value (no edit mode needed)
  - Date: Click opens an inline date picker calendar
  - Date & Time: Click opens date+time picker with time following OS regional settings
  - List/Tags: Click to add items; each item appears as a pill/chip with its own delete button; autocomplete suggests existing values
- **Auto-save**: Changes are saved immediately to the frontmatter — no explicit save action required.

#### Changing a Property Type

- Click the **type icon** to the left of the property name.
- A dropdown menu appears listing all available types (Text, List, Number, Checkbox, Date, Date & Time).
- Selecting a new type changes it **globally** — all properties with that name across the vault adopt the new type.
- Note: Type changes can cause data loss if existing values are incompatible (e.g., text → number when text contains non-numeric values).

#### Removing a Property

- **Keyboard**: Focus on the property row and press `Cmd/Ctrl + Backspace` to delete it.
- **Manual**: Clear both the name and value, then move focus away — the empty row is removed.
- Removal only affects the current note. The property definition persists globally (visible in the All Properties view) until it has zero usage.

#### Reordering Properties

- **Drag and drop**: On desktop, grab the type icon on the left side of a property row and drag it up or down to reorder. This changes the order of YAML keys in the frontmatter.
- Order of properties does not affect functionality — it's purely a display preference per note.

#### Collapsing/Expanding

- Click the "Properties" heading to collapse the entire section into a single line.
- The collapse state is remembered per note.
- When collapsed, only the "Properties" heading is visible with a count indicator (e.g., "Properties (5)").
- Community plugins like "Fold Properties By Default" allow setting all notes to open with properties collapsed.

### 1.5 Keyboard Navigation

When the properties section is focused:

| Action | Shortcut |
|--------|----------|
| Move to next property | `↓` or `Tab` |
| Move to previous property | `↑` or `Shift+Tab` |
| Jump from properties to editor content | `Alt+↓` |
| Delete current property | `Cmd/Ctrl+Backspace` |
| Switch between name and value | `←` / `→` |
| Add new property (global) | `Cmd/Ctrl+;` |

Vim keybindings (`j`, `k`, `h`, `l`, `A`, `i`, `o`) are also supported when Vim mode is enabled.

### 1.6 Properties View (Global Management)

The "Properties view" core plugin provides two sidebar panels:

#### All Properties View
- Lists **every property name** used across the entire vault.
- Shows a **usage count** next to each property (how many notes use it).
- Right-click a property to:
  - **Rename** it (updates all occurrences across all notes in the vault).
  - **Change its type** (global type change).
  - As of v1.10: **Mass delete** a property from all notes.
- Serves as the single source of truth for the "schema" of your vault's metadata.

#### File Properties View
- Shows properties for the currently active note in a sidebar panel.
- Useful when properties are set to "Hidden" in the editor — users can view and edit properties in the sidebar without them taking up space at the top of the note.

### 1.7 Search Integration

Properties have dedicated search syntax:

- `[property]` — find notes that have this property (any value)
- `[property:value]` — find notes where the property matches a specific value
- Supports boolean logic, sub-queries, grouping, OR operators, exact matching, and regex.
- Works with Obsidian's Bases (database) feature for filtering, sorting, grouping, formulas, and aggregations.

### 1.8 YAML ↔ Visual UI Relationship

- The visual properties UI is a **1:1 representation** of the YAML frontmatter.
- Every edit in the visual UI immediately updates the YAML text (and vice versa in Source mode).
- The YAML must appear at the very start of the file, delimited by `---`.
- Internal links in property values require quotes: `"[[Link]]"`.
- JSON format is supported but auto-converted to YAML on save.
- Nested properties (YAML objects within objects) are **not supported** in the visual editor — they require Source mode to view and edit.

---

## 2. Linear Metadata (Secondary Inspiration)

### 2.1 Overview

Linear is a project management tool known for its exceptionally clean, fast, keyboard-driven interface. Issues in Linear are the core unit of work, and each issue carries structured metadata (status, priority, assignee, labels, etc.) that is edited through a variety of interaction patterns designed for maximum speed.

**Key design philosophy**: Minimal required fields (only title + status are mandatory), fast keyboard-driven workflows, and consistent interaction patterns across all metadata fields. Speed and focus over configurability.

### 2.2 Visual Design

#### Issue Detail Page Layout

The issue detail page uses a **two-column layout**:

- **Left/center column (main content)**: Contains the issue title, description (rich text with Markdown support), activity feed, and comments. The content column is centered on larger screens (not stretched edge-to-edge), improving readability.
- **Right column (properties sidebar)**: Contains all metadata fields in a vertical list. The sidebar grows proportionally with screen width, giving more room for fields that need it (labels, for example). The sidebar can be toggled with `Cmd/Ctrl + I`.

#### Metadata Fields Layout

Each metadata field in the right sidebar follows a consistent pattern:

- **Label** (left-aligned, muted/secondary text): The field name (e.g., "Status", "Priority", "Assignee")
- **Value** (right-aligned or inline): The current value, displayed with type-appropriate formatting:
  - Status: Colored dot/icon + status name (e.g., "● In Progress")
  - Priority: Icon + priority level (e.g., "⚡ Urgent", "↑ High")
  - Assignee: Avatar circle + name
  - Labels: Colored tag pills
  - Due date: Calendar icon + date text
  - Estimate: Number or t-shirt size
  - Cycle: Cycle icon + name
  - Project: Project icon + name

#### Typography & Visual Hierarchy

- Linear uses **Inter** for body text and **Inter Display** for headings, providing subtle typographic distinction.
- Field labels are smaller and muted (secondary text color).
- Field values use the primary text color and are visually prominent.
- The overall palette is muted with intentional use of color only for status indicators, priority levels, and labels — color carries meaning, not decoration.
- The LCH-based color system ensures perceptual uniformity across themes.

#### Information Density

Linear achieves high information density without feeling cluttered through:

- **Consistent vertical rhythm**: Each field row has identical height and spacing.
- **No unnecessary borders or dividers**: Fields are separated by whitespace alone.
- **Compact iconography**: Small, simple icons that convey type at a glance.
- **Proportional scaling**: The sidebar grows with screen size rather than being fixed-width, avoiding cramped layouts on small screens and wasted space on large ones.

### 2.3 Metadata Fields

#### Core Issue Properties

| Field | Required | Input Type | Keyboard Shortcut |
|-------|----------|------------|-------------------|
| **Title** | Yes | Inline text | Click to edit |
| **Status** | Yes | Dropdown select | `S` or `Alt+Cmd+1-9` |
| **Priority** | No | Dropdown select (Urgent/High/Medium/Low/None) | `P` |
| **Assignee** | No | User picker dropdown | `A` (assign), `I` (assign to me) |
| **Labels** | No | Multi-select tag picker | `L` (add), `Shift+L` (remove) |
| **Due date** | No | Date picker | `Cmd+D` (set), `Cmd+Shift+D` (remove) |
| **Estimate** | No | Select (points or t-shirt sizes) | `Shift+E` |
| **Cycle** | No | Dropdown select | — |
| **Project** | No | Dropdown select | — |

#### Display Properties (configurable per view)

These additional metadata fields can be shown or hidden in list/board views:
- Issue ID, Priority, Status, Labels, Project, Cycle, Created, Updated, Assignee, Estimate, Links, Time in status, Sentry issues, Pull Requests and Commits, SLA (Business/Enterprise)

### 2.4 Interaction Patterns

#### Inline Editing

- **Title and description**: Click directly on the text to enter edit mode. Changes save automatically — no save button, no modal, no form submission.
- **Metadata fields**: Click on any field value in the right sidebar to open a dropdown/popover for editing. The interaction is always **click → popover → select/type → auto-dismiss**.

#### Field Editing Patterns

All metadata fields follow a consistent interaction model:

1. **Click the field value** (or use the keyboard shortcut) — this opens a popover/dropdown anchored to the field.
2. **Type to filter** — most dropdowns support type-ahead search to quickly narrow options (status names, team members, labels, etc.).
3. **Select an option** — click or press Enter to apply. For multi-select fields (labels), you can select multiple items before dismissing.
4. **Auto-dismiss** — for single-select fields, the popover closes automatically after selection. For multi-select, click outside or press Escape to dismiss.

This pattern is **identical** across all field types — the only thing that changes is the content of the popover (list of statuses vs. list of users vs. color-coded labels vs. date picker).

#### Contextual Menus

Right-clicking an issue (or using the `…` menu) opens a contextual menu that provides access to all metadata operations:
- Set status, priority, assignee, estimate
- Mark as blocking/blocker
- Flag as duplicate
- Add to cycle or project
- Copy git branch name
- Archive issue

Each menu item shows its keyboard shortcut on the right side, serving as a learning mechanism.

**Safe area triangles**: Linear implements a sophisticated "safe area" between the cursor and sub-menus using CSS `clip-path`. This prevents sub-menus from closing prematurely when users move their mouse diagonally toward a sub-menu item — a subtle but important UX detail for deeply nested menus.

#### Command Menu

`Cmd/Ctrl + K` opens a command palette where users can search for any action, including metadata changes. This provides a third access path (alongside direct keyboard shortcuts and mouse clicks) for every operation.

#### Batch Operations

- Select multiple issues (`Cmd+Click`, `Shift+Click`, or `Cmd+A` for all)
- Then use any keyboard shortcut (e.g., `P` to change priority) to apply changes to all selected issues simultaneously.

### 2.5 Keyboard-Driven Workflows

Linear is designed as a **keyboard-first** application. Nearly every action can be performed without a mouse:

| Category | Shortcut | Action |
|----------|----------|--------|
| **Navigation** | `G` then `I` | Go to Inbox |
| | `G` then `M` | Go to My Issues |
| | `G` then `A` | Go to Active Issues |
| | `G` then `B` | Go to Backlog |
| **Issue Actions** | `C` | Create new issue |
| | `E` | Edit issue |
| | `R` | Rename issue |
| | `S` | Change status |
| | `P` | Change priority |
| | `A` | Assign to user |
| | `I` | Assign to me |
| | `L` | Add label |
| | `Shift+L` | Remove label |
| | `Cmd+D` | Set due date |
| | `Shift+E` | Change estimate |
| **Navigation** | `J` / `K` | Move up/down in lists |
| | `Space` | Peek preview (quick look) |
| | `[` | Collapse sidebar |
| **Meta** | `Cmd+K` | Command palette |
| | `?` | Show keyboard shortcuts help |

The **peek preview** (`Space`) is particularly notable — it shows issue details (description, assignee, status, priority, cycle, labels, estimate, dates) in a modal overlay without navigating away from the list, similar to macOS Quick Look.

### 2.6 Design Principles

- **Speed over flexibility**: Linear avoids excessive customization options, reasoning that configuration overhead slows down adoption. The product makes strong default choices rather than exposing every option.
- **Consistency of interaction**: Every metadata field uses the same click → popover → select pattern. Users learn one interaction model and it works everywhere.
- **Progressive disclosure**: Right-click menus show keyboard shortcuts, teaching users the faster path organically over time.
- **3-minute grace period**: Changes to issue properties within the first 3 minutes of creation are considered part of the creation process and don't appear in activity logs — reducing noise.
- **Undo**: `Cmd+Z` reverses most operations, including moving issues between teams.

---

## 3. Shared Design Principles

Both products share several fundamental approaches:

### 3.1 Inline Editing Over Modals

Neither product uses modal dialogs for editing metadata. Both favor inline or popover-based editing that keeps the user in context:
- Obsidian: Properties are edited directly in the properties section at the top of the note.
- Linear: Metadata is edited via click-to-open popovers anchored to each field.

### 3.2 Keyboard Accessibility as First-Class

Both products provide comprehensive keyboard navigation for metadata:
- Obsidian: Arrow keys, Tab, Cmd+;, Cmd+Backspace for property management.
- Linear: Single-letter shortcuts (S, P, A, L, etc.) for every metadata operation.

### 3.3 Auto-Save

Neither product requires an explicit save action for metadata changes. Edits are applied immediately.

### 3.4 Type-Specific Input Affordances

Both products match the input UI to the data type:
- Dates → date pickers
- Booleans → checkboxes/toggles
- Selections → dropdowns with search/filter
- Text → inline text inputs

### 3.5 Autocomplete for Consistency

Both products use autocomplete to drive consistency:
- Obsidian: Suggests existing property names and values from across the vault.
- Linear: Type-ahead search in dropdowns to quickly find statuses, team members, labels, etc.

### 3.6 Minimal Visual Chrome

Both products avoid heavy visual decoration around metadata:
- Obsidian: No borders around the properties section by default; clean key-value layout with whitespace separation.
- Linear: No borders between fields; whitespace and consistent spacing create visual structure.

---

## 4. Key Differences

| Aspect | Obsidian | Linear |
|--------|----------|--------|
| **Placement** | Top of note, inline with content | Right sidebar, separate from content |
| **Schema model** | User-defined, any key name allowed, types enforced per-name globally | Fixed set of system properties + limited custom fields |
| **Data storage** | Plain-text YAML in each file | Database (cloud-hosted) |
| **Flexibility** | Fully open — any property name, any type combination | Constrained — predefined fields with fixed types |
| **Global management** | All Properties view for vault-wide schema management | Workspace settings for custom fields |
| **Required fields** | None required (all properties optional) | Title + status required |
| **Keyboard model** | Arrow/Tab navigation within properties section | Single-letter shortcuts from anywhere on the page |
| **Reordering** | Drag-and-drop within a note | No field reordering (fixed layout) |
| **Collapse** | Properties section can be collapsed per note | Sidebar can be toggled open/closed |
| **Search syntax** | `[property:value]` in search | Filters with property-specific operators |

---

## 5. Patterns Recommended for Thought.Haus

Based on this research and Thought.Haus's character as a **local-first, warm, minimal markdown note app**, here are the specific patterns that would integrate well:

### 5.1 From Obsidian (Primary Patterns)

1. **Properties at the top of the note, inline with content** — This is the right placement for a note-taking app. Properties are part of the note, not a separate panel. Thought.Haus already uses frontmatter; a visual UI over it is the natural evolution.

2. **YAML frontmatter as the storage layer** — Thought.Haus already stores notes as markdown files with frontmatter. The visual properties UI should be a 1:1 representation of the frontmatter, just like Obsidian. Edits in the visual UI update the YAML; edits to the raw markdown update the visual UI.

3. **Type icons as drag handles and type selectors** — The dual-purpose icon (click to change type, drag to reorder) is space-efficient and elegant.

4. **Autocomplete for property names** — Essential for consistency in a vault/folder of notes. When adding a new property, suggest names already used in other notes.

5. **Collapsible properties section** — Many notes will have properties users don't need to see while writing. A simple collapse toggle keeps the editor focused.

6. **"Add property" affordance** — A subtle `+ Add property` button at the bottom of the properties section, always visible but not visually dominant.

7. **Global Properties view** — A way to see all property names used across notes, their types, and usage counts. This becomes the "schema management" surface.

### 5.2 From Linear (Secondary Patterns)

1. **Consistent click → popover → select interaction model** — Every property value edit should follow the same pattern: click the value → a popover appears → type to filter / select → auto-dismiss. This one interaction model should work for all types.

2. **Keyboard shortcuts for common property operations** — Not single-letter shortcuts (which conflict with typing in a note editor), but Cmd/Ctrl-based shortcuts for adding properties, navigating between them, and deleting them.

3. **Type-ahead search in dropdowns** — When selecting values for enumerated properties (like tags), the dropdown should support typing to filter.

4. **Proportional layout** — Property values should be given room to breathe. Don't fix rigid widths; let the value column flex with the available space.

5. **Muted labels, prominent values** — Property names in a muted secondary color; property values in the primary text color. This creates a clear visual hierarchy where the data (values) stands out over the structure (labels).

6. **Auto-save with no save button** — Changes to properties should be saved immediately, just like changes to the note content in TipTap.

### 5.3 Thought.Haus-Specific Adaptations

1. **Warm visual treatment** — Use Thought.Haus's warm color palette (`--color-accent: #b8621b`, warm tones) for property type icons and interactive elements. The properties section should feel like a natural part of Thought.Haus's warm, minimal aesthetic, not a cold database table.

2. **Integration with existing tags** — Thought.Haus's existing tag system (parsed from frontmatter) should seamlessly become a property type. The `tags` property should have a rich tag input with autocomplete from existing tags.

3. **Respect the file** — Since Thought.Haus is local-first with plain markdown files, the properties UI must be a faithful visual representation of the YAML frontmatter. Users who open their notes in another editor should see clean, predictable YAML.

4. **Progressive complexity** — Start with a simple set of types (text, list/tags, number, checkbox, date) that covers 95% of use cases. Avoid overwhelming with options. Don't add datetime, URL, or link types unless demand is clear.

5. **No global schema enforcement initially** — Unlike Obsidian which enforces type-per-name globally, Thought.Haus could start simpler: suggest existing property names but don't prevent type mismatches. Add enforcement later if users need it.

---

## 6. Sources

### Obsidian
- [Obsidian Properties — Official Help](https://help.obsidian.md/properties)
- [Properties View Plugin — Official Help](https://help.obsidian.md/plugins/properties)
- [Properties and Metadata — DeepWiki](https://deepwiki.com/obsidianmd/obsidian-help/4.3-properties-and-metadata)
- [Obsidian v1.4 Changelog](https://obsidian.md/changelog/2023-08-31-desktop-v1.4.5/)
- [An Introduction to Obsidian Properties — Obsidian Rocks](https://obsidian.rocks/an-introduction-to-obsidian-properties/)
- [Obsidian Properties: The New Feature That Changes Everything — Medium](https://medium.com/@dianademco/obsidian-properties-the-new-feature-that-changes-everything-68077acc48fe)
- [Harnessing the Power of Metadata — Future of KM](https://futureofkm.substack.com/p/what-is-obsidian-properties)
- [Obsidian Properties in YAML Frontmatter — Nicole van der Hoeven](https://nicolevanderhoeven.com/blog/20230726-obsidian-properties-in-yaml/)
- [Properties CSS Variables — Obsidian Developer Docs](https://docs.obsidian.md/Reference/CSS+variables/Editor/Properties)
- [Custom CSS for Properties — Obsidian Forum](https://forum.obsidian.md/t/my-custom-css-for-the-new-propeties-feature/66161)
- [Collapse/Fold Properties — Obsidian Forum](https://forum.obsidian.md/t/add-setting-to-collapse-fold-properties-across-all-notes-by-default/67943)

### Linear
- [How We Redesigned the Linear UI (Part II)](https://linear.app/now/how-we-redesigned-the-linear-ui)
- [Invisible Details — Linear Blog](https://linear.app/now/invisible-details)
- [Linear Inline Editing — Changelog](https://linear.app/changelog/2022-06-09-inline-editing)
- [Issue View Layout — Changelog](https://linear.app/changelog/2021-06-03-issue-view-layout)
- [Display Options — Linear Docs](https://linear.app/docs/display-options)
- [Creating Issues — Linear Docs](https://linear.app/docs/creating-issues)
- [Editing Issues — Linear Docs](https://linear.app/docs/editing-issues)
- [Concepts — Linear Docs](https://linear.app/docs/conceptual-model)
- [Peek Preview — Linear Docs](https://linear.app/docs/peek)
- [Linear Keyboard Shortcuts — KeyCombiner](https://keycombiner.com/collections/linear/)
- [Linear Shortcuts — Shortcuts.design](https://shortcuts.design/tools/toolspage-linear/)
- [Linear Design System — Figma Community](https://www.figma.com/community/file/1222872653732371433/linear-design-system)
