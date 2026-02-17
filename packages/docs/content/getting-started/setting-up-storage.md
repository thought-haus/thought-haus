---
title: Setting Up Storage
description: How to connect Thought.Haus to a local folder or WebDAV server for the first time.
---

## Choosing a Storage Backend

Thought.Haus supports two storage backends. The one you use depends on your browser and preferences.

### Local Folder (Chromium Only)

This is the simplest option. You select a folder on your computer and Thought.Haus reads and writes Markdown files directly inside it.

1. Open Thought.Haus in a Chromium browser (Chrome, Edge, Brave, or Arc).
2. On the onboarding screen, click **Select Folder**.
3. Choose an existing folder or create a new one. This is where all your notes and attachments will live.
4. Grant the browser permission to read and write to that folder when prompted.

The browser will remember your folder selection across sessions. If permission is lost (for example, after a browser restart), Thought.Haus will ask you to re-grant access.

### WebDAV Server (All Supported Browsers)

WebDAV lets you connect to a server that exposes your notes folder over HTTP. This works in both Chromium browsers and Firefox.

1. On the onboarding screen, select **WebDAV**.
2. Enter the server URL (e.g., `http://localhost:4918` or `https://your-server.com/dav/notes`).
3. If required, enter your username and password.
4. Click **Connect**. Thought.Haus will verify the connection before proceeding.

## Folder Structure

Once connected, Thought.Haus will scan the folder for existing `.md` files and load them as notes. It also creates a `.thoughthouse/` directory for internal metadata like favorites and search index data. Attachment subdirectories are created as needed when you add images or files to notes.

```
your-notes-folder/
├── .thoughthouse/              # App metadata
│   └── favorites.json
├── 20240322T131856/            # Attachments for this note
│   └── photo.jpg
├── 20240322T131856--meeting-notes.md
├── 20240323T091200--project-ideas.md
└── random-note.md
```

## Re-Granting Permissions

For local folder storage, browsers revoke file system permissions when you close the browser or after a period of inactivity. When this happens, Thought.Haus shows a re-permission screen where you can click to restore access to the same folder without re-selecting it.

## Switching Storage

To switch from one storage backend to another (or to point to a different folder), you can use the settings. Your notes remain wherever they were stored — Thought.Haus does not move or delete them when you disconnect.
