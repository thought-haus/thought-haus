---
title: Creating Your First Note
description: How to create, edit, and save your first note in Thought.Haus.
---

## Creating a New Note

Once you've connected a storage folder, creating a note is straightforward:

1. Click the **+** button in the sidebar or notes list.
2. A new note opens in the editor with an empty title and body.
3. Type a title at the top. This becomes part of the filename.
4. Write your content in the editor below.

Your note is saved automatically as you type — no need to press `Ctrl+S` or click a save button.

## Understanding the File That Gets Created

When you create a note titled "Meeting Notes", Thought.Haus creates a file like:

```
20240322T131856--meeting-notes.md
```

The filename has two parts:
- **`20240322T131856`** — A timestamp ID (year, month, day, hour, minute, second) generated at creation time. This never changes, even if you rename the note.
- **`meeting-notes`** — A slugified version of your title, used for readability.

Inside the file, you'll see YAML frontmatter followed by your content:

```markdown
---
title: Meeting Notes
tags: []
created: 2024-03-22T13:18:56.000Z
modified: 2024-03-22T13:18:56.000Z
---

Your note content goes here.
```

## Basic Editing

The editor supports standard Markdown formatting as you type:

- Type `# ` for a heading (use more `#` marks for smaller headings)
- Use `**bold**` and `*italic*` or the keyboard shortcuts `Cmd/Ctrl+B` and `Cmd/Ctrl+I`
- Start a line with `- ` or `1. ` for lists
- Use `` ` `` for inline code or ``` ``` ``` for code blocks

The editor renders your Markdown in real time, so you see the formatted result as you write.

## Saving

Thought.Haus auto-saves your work. A small status indicator near the editor shows the current save state:

- **Saving** — A change is being written to disk.
- **Saved** — All changes have been written.

There is a short debounce delay so that rapid typing doesn't trigger excessive file writes.

## What's Next

From here you can explore [tags](/organization/tags) to organize your notes, [note linking](/editor/note-linking) to connect related ideas, or [search](/organization/search) to find notes quickly.
