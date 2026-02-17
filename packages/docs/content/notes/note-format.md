---
title: Note Format
description: How Thought.Haus names and structures note files on disk.
---

## Filename Convention

Thought.Haus uses a specific filename format for notes:

```
YYYYMMDDTHHMMSS--slugified-title.md
```

For example:
```
20240322T131856--meeting-notes.md
20240915T083012--project-roadmap.md
20241001T170045--grocery-list.md
```

### Timestamp ID

The first part (`20240322T131856`) is a compact ISO-like timestamp representing the note's creation time. It serves as the note's permanent, unique identifier. This ID:

- Is generated once when the note is created
- Never changes, even if you edit the title
- Is used for note linking (`[[20240322T131856]]`)
- Is used in the URL hash for navigation (`#20240322T131856`)

### Slugified Title

The part after `--` is a URL-friendly version of the note's title. Spaces become hyphens, special characters are removed, and everything is lowercased. This makes filenames readable when browsing your notes folder in a file manager or terminal.

When you change a note's title, the slug portion is updated (the file is renamed), but the timestamp stays the same.

## Plain Markdown Files

Thought.Haus also supports plain `.md` files without the timestamp prefix. If you have existing Markdown files in your notes folder, they'll appear in the app. Their raw filename (without `.md`) is used as the note ID.

```
ideas.md
travel-packing-list.md
```

These notes work normally in the editor. However, they can't be targeted with the `[[timestamp]]` linking syntax since they don't have a timestamp ID.

## File Contents

Each note file contains optional YAML frontmatter followed by Markdown content:

```markdown
---
title: Meeting Notes
tags:
  - work
  - meetings
created: 2024-03-22T13:18:56.000Z
modified: 2024-03-22T14:30:00.000Z
---

## Agenda

- Review Q1 results
- Plan Q2 priorities
```

The frontmatter is optional. A plain Markdown file without frontmatter is valid and will be loaded with defaults.

## External Compatibility

Because notes are standard Markdown files, they work with any Markdown-compatible tool — VS Code, Obsidian, iA Writer, Typora, or even `cat` in a terminal. The frontmatter follows standard YAML conventions that most tools understand. You can freely edit notes outside of Thought.Haus and changes will be picked up automatically.
