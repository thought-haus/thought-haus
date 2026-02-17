---
title: External Editing
description: How Thought.Haus handles notes edited outside the app, including file watching and sync behavior.
---

## Editing Notes Outside Thought.Haus

Since notes are plain Markdown files, you can edit them with any text editor — VS Code, Vim, Typora, Obsidian, or anything else. Thought.Haus watches for external changes and updates the app accordingly.

## File Watching

Thought.Haus monitors your notes folder for changes using two mechanisms:

### Polling

The app polls the storage folder every 7 seconds, checking file modification times against its in-memory state. When it detects a file that has been modified externally, it re-reads the file and updates the note in the app.

### Focus-Based Refresh

When you switch back to the Thought.Haus window (or tab), the app immediately checks for changes. This catches edits you made in another application while Thought.Haus was in the background, without waiting for the next poll cycle.

### FileSystemObserver (Progressive Enhancement)

On browsers that support the `FileSystemObserver` API, Thought.Haus uses it for instant change notifications instead of relying solely on polling. This is a progressive enhancement — the app falls back to polling on browsers that don't support it.

## What Gets Detected

The file watcher picks up:

- **Modified files** — Content or frontmatter changes made in another editor.
- **New files** — Markdown files added to the folder (e.g., by another app or a sync tool).
- **Deleted files** — Files removed from the folder are removed from the notes list.
- **Renamed files** — Detected as a delete + create, since the file system doesn't distinguish renames from delete/create pairs.

## Working With Sync Tools

If you use a file sync tool (Syncthing, Dropbox, iCloud, etc.) to keep your notes folder in sync across devices, Thought.Haus handles incoming synced changes through the same file watching mechanism. New or modified files from other devices appear automatically.

### Tips for Smooth Syncing

- Avoid editing the same note on two devices simultaneously — last write wins and you may lose changes.
- Use a sync tool that handles conflict files (e.g., Syncthing's `.sync-conflict` files) so you can manually resolve overlapping edits.
- The `.thoughthouse/` metadata directory can be excluded from sync if you prefer each device to maintain its own favorites and index.

## Adding Notes Manually

You can create new notes by dropping `.md` files directly into your notes folder. If you follow the `YYYYMMDDTHHMMSS--slug.md` naming convention, the note will have a proper timestamp ID. Plain `.md` files without the timestamp prefix also work — they'll appear using their filename as the ID.
