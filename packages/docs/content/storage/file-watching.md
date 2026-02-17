---
title: File Watching
description: How Thought.Haus detects changes to your notes made outside the app.
---

## Overview

Thought.Haus monitors your notes folder for changes made by other applications — text editors, sync tools, or other instances of Thought.Haus. When changes are detected, the app updates its in-memory state and search index automatically.

## How It Works

File watching uses three complementary mechanisms:

### Polling

A timer scans the entire notes folder every **7 seconds**. Each scan:

1. Lists all `.md` files via the storage backend
2. Compares against the current in-memory note list
3. Detects **added**, **modified**, and **deleted** files
4. Applies changes to the note store and search index

A file is considered **modified** when its `lastModified` timestamp or `size` has changed since the last scan.

### Focus Events

Whenever the browser window regains focus, an immediate scan is triggered. This ensures that changes made while the app was in the background are picked up right away when you return.

### FileSystemObserver (Progressive Enhancement)

On browsers that support the `FileSystemObserver` API (Chrome 127+), Thought.Haus registers a native file system observer on the directory handle. This provides near-instant change notifications without waiting for the next poll cycle.

This is a **progressive enhancement** — the polling and focus-event mechanisms always run as a baseline. The `FileSystemObserver` simply adds faster detection when available.

## What Happens When Changes Are Detected

### New Files

New `.md` files are parsed (frontmatter, title, tags) and added to the note list and search index.

### Modified Files

Modified notes are re-read from disk. Their frontmatter, title, tags, and body are refreshed in both the note store and the search index.

### Deleted Files

Deleted notes are removed from the note list, search index, and favorites. If the deleted note was currently selected, the selection is cleared.

## WebDAV File Watching

WebDAV storage does not support push notifications, so only polling and focus events are used. The same 7-second interval applies. Changes made on the server (by another client or sync tool) are detected within one poll cycle.

## Performance

Each poll cycle reads file metadata (names, sizes, timestamps) for the entire folder, but only reads file **content** for files that are new or modified. This keeps the overhead low even for large note collections.
