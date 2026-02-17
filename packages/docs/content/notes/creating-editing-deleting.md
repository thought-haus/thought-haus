---
title: Creating, Editing, and Deleting Notes
description: How to create new notes, edit existing ones, and delete notes you no longer need.
---

## Creating Notes

Click the **+** button in the sidebar or notes list to create a new note. A new Markdown file is immediately created in your storage folder with a timestamp-based filename and empty frontmatter. The editor opens so you can start writing right away.

Each new note gets a unique ID based on the exact moment it was created (e.g., `20240322T131856`). This ID is permanent and never changes, even if you rename the note.

## Editing Notes

Select any note from the sidebar or notes list to open it in the editor. Changes are written directly to the underlying Markdown file as you type, with a short debounce delay to avoid excessive disk writes.

### Title Changes and File Renames

When you change a note's title, Thought.Haus renames the file to match. The process is:

1. A new file is created with the updated slug (e.g., `20240322T131856--new-title.md`).
2. The note content is written to the new file.
3. The old file is deleted.

The timestamp ID stays the same — only the slug portion of the filename changes. This means links to the note (`[[20240322T131856]]`) remain valid after a rename.

## Deleting Notes

To delete a note, use the delete option in the note's context menu or the note actions area. The Markdown file is removed from your storage folder. If the note had attachments, the corresponding `<noteId>/` attachment directory is also cleaned up.

Deletion is permanent — there is no trash or undo. Since your notes are plain files, you can use your operating system's trash/recycle bin or a version control system like Git if you want a safety net.

## Notes Without Timestamps

Thought.Haus also recognizes plain `.md` files that don't follow the timestamp naming scheme. If you drop a file like `random-note.md` into your notes folder, it will appear in the app using its raw filename as the ID. These notes work the same way in the editor, though they won't have the timestamp-based linking format.
