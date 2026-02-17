---
title: Local Folder Storage
description: Store your notes as Markdown files in a local folder using the File System Access API.
---

## Overview

Thought.Haus can store notes directly in a folder on your computer using the browser's File System Access API. Notes are plain Markdown files — no database, no sync service, no lock-in. You can open them in any text editor.

## Browser Support

Local folder storage requires a Chromium-based browser:

- **Google Chrome**
- **Microsoft Edge**
- **Brave**
- **Arc**

Firefox does not support the File System Access API. Use [WebDAV storage](/webdav) instead.

## Setting Up

1. Open Thought.Haus for the first time (or after disconnecting storage)
2. On the onboarding screen, select the **Local Folder** tab
3. Click **Choose Folder**
4. Select or create a folder in the system file picker
5. Grant **read and write** permission when prompted

Thought.Haus scans the folder for existing `.md` files and indexes them. If the folder is empty, a welcome note is created automatically.

## How Files Are Stored

### File Naming

Notes follow the naming convention:

```
YYYYMMDDTHHMMSS--slugified-title.md
```

For example: `20240322T131856--meeting-notes.md`

The timestamp prefix is the note's unique, immutable ID. The slug portion updates when you rename a note (the file is renamed on disk).

Plain `.md` files without the timestamp prefix are also supported — they use the raw filename as their ID.

### Frontmatter

Each note starts with YAML frontmatter containing metadata:

```yaml
---
title: Meeting Notes
tags: work, meetings
---
```

Tags, properties, and other metadata are stored in the frontmatter. The body follows after the closing `---`.

### Attachments

Attachments are stored in a subdirectory named after the note's ID, directly inside your notes folder. Images render inline in the editor; other files appear as download cards.

## Folder Structure

```
your-notes-folder/
  20240322T131856--meeting-notes.md
  20240401T093000--project-ideas.md
  20240322T131856/              # Attachments for meeting-notes
    screenshot.png
  .thoughthouse/
    favorites.json
```

The `.thoughthouse/` directory stores app metadata like your favorites list.

## Disconnecting

To switch to a different folder or storage method, open **Settings > Storage** and click **Change Storage**. This disconnects the current folder without deleting any files.
