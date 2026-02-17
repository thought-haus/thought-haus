---
title: Auto-Save
description: How Thought.Haus automatically saves your notes as you type, with debouncing to avoid excessive file writes.
---

## How Auto-Save Works

Thought.Haus saves your notes automatically as you type. There is no manual save button and no `Ctrl+S` shortcut needed. Every change you make in the editor is written directly to the underlying Markdown file on disk.

## Debouncing

To avoid writing to disk on every single keystroke, saves are debounced. When you stop typing for a short moment, Thought.Haus writes the current state of the note to the file. If you keep typing continuously, the save waits until you pause.

This balances two goals:
- **Minimal data loss** — Your changes are persisted quickly after each edit.
- **Efficient I/O** — Rapid keystrokes don't hammer the file system with writes.

## Save Status Indicator

A small status indicator near the editor shows the current state of your note:

- **Saving** — A write is in progress. Your latest changes are being written to disk.
- **Saved** — All changes have been successfully written. The file on disk matches what you see in the editor.

If you close the browser tab or navigate away while the status shows "Saved", no work is lost.

## What Gets Saved

Each save writes the complete note file, including:

- **Frontmatter** — Title, tags, dates, and any custom properties.
- **Content** — The full Markdown body of the note.
- **Modified timestamp** — The `modified` field in frontmatter is updated to the current time.

## Edge Cases

### Concurrent Edits

If you edit the same note file in an external editor while it's open in Thought.Haus, the file watcher will detect the external change and update the editor. The most recent save wins. To avoid conflicts, it's best to edit a note in one place at a time.

### Large Notes

Auto-save works the same regardless of note size. The debounce interval remains constant — larger notes simply take slightly longer to write, but this is rarely noticeable.
