---
title: Frontmatter
description: How Thought.Haus uses YAML frontmatter to store note metadata like title, tags, and dates.
---

## What is Frontmatter?

Frontmatter is a block of YAML metadata at the top of a Markdown file, enclosed between `---` delimiters. Thought.Haus uses frontmatter to store structured information about each note — its title, tags, creation date, and more.

```markdown
---
title: Weekly Review
tags:
  - journal
  - weekly
created: 2024-03-22T13:18:56.000Z
modified: 2024-03-22T14:30:00.000Z
---

Your note content starts here.
```

## Standard Fields

### title

The display name of the note. This is what appears in the sidebar, search results, and the editor header. Changing the title in the editor updates both the frontmatter and the filename slug.

### tags

An array of strings used to organize notes. Tags are the primary way to categorize and filter notes in Thought.Haus. See [Tags](/organization/tags) for details.

```yaml
tags:
  - work
  - project-alpha
  - meeting-notes
```

### created

An ISO 8601 timestamp recording when the note was first created. This is set automatically and does not change.

### modified

An ISO 8601 timestamp updated each time the note is saved. Used for sorting notes by modification date.

## How Frontmatter is Parsed

Thought.Haus uses a hand-rolled YAML parser rather than a full YAML library. It handles the subset of YAML needed for note metadata: scalar values, arrays (both inline and block style), and nested key-value pairs. This keeps the parser lightweight and predictable.

The parser reads frontmatter when a note is loaded and serializes it back when saving. Fields you don't modify are preserved as-is, and any custom properties you add are kept intact.

## Notes Without Frontmatter

If a Markdown file has no frontmatter block, Thought.Haus will load it with default values — the filename as the title, an empty tags array, and the file's modification date as both created and modified timestamps. Frontmatter is added automatically the first time you save such a note through the editor.

## Editing Frontmatter

Frontmatter is managed through the Thought.Haus UI rather than edited as raw YAML in the editor. The title field at the top of the editor updates the `title` property, and tags can be managed through the tag interface. For custom properties, see [Custom Properties](/notes/custom-properties).
