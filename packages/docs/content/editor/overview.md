---
title: Editor Overview
description: An introduction to the Thought.Haus editor, built on TipTap with live Markdown rendering.
---

## The TipTap Editor

Thought.Haus uses [TipTap](https://tiptap.dev/), a headless editor framework built on ProseMirror, for its note editing experience. TipTap provides a rich-text editing surface that understands Markdown — you type Markdown syntax and it renders as formatted text in real time.

## How It Works

The editor operates in a hybrid mode between raw Markdown and rich text:

- **Markdown input** — You can type standard Markdown syntax (`# heading`, `**bold**`, `- list item`) and it's immediately rendered as formatted text.
- **Keyboard shortcuts** — Standard formatting shortcuts like `Cmd/Ctrl+B` for bold and `Cmd/Ctrl+I` for italic work as expected.
- **Rich output** — What you see in the editor is the rendered result, not raw Markdown source. Headings appear as headings, bold text appears bold, and so on.
- **Markdown storage** — Despite the rich rendering, notes are stored as standard Markdown files on disk.

## Editor Layout

The editor occupies the main content area in the three-column layout:

- **Title field** — At the top, a large editable field for the note title. Changes here update the frontmatter and trigger a file rename.
- **Content area** — The main writing surface where you compose your note.
- **Status bar** — Shows save status (saving/saved) and word count.

## Supported Content Types

The editor supports a range of content types through TipTap extensions:

- **Text formatting** — Bold, italic, strikethrough, inline code
- **Headings** — Six levels (`#` through `######`)
- **Lists** — Bullet lists, ordered lists, and task lists with checkboxes
- **Code blocks** — Fenced code blocks with syntax indication
- **Blockquotes** — Indented quote blocks
- **Horizontal rules** — Dividers via `---`
- **Links** — Clickable URLs
- **Images** — Inline image rendering for attached images
- **Note links** — `[[note-id]]` syntax for linking between notes
- **Tables** — Structured data in table format

## Keyboard Shortcuts

Common shortcuts include:

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + Shift + X` | Strikethrough |
| `Cmd/Ctrl + E` | Inline code |
| `Cmd/Ctrl + Shift + 7` | Ordered list |
| `Cmd/Ctrl + Shift + 8` | Bullet list |
| `Cmd/Ctrl + Shift + 9` | Task list |
| `Cmd/Ctrl + K` | Command palette |
