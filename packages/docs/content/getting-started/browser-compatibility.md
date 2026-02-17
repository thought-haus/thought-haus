---
title: Browser Compatibility
description: Which browsers work with Thought.Haus and what storage options are available in each.
---

## Supported Browsers

Thought.Haus runs in modern browsers but relies on APIs that are not universally available. Your browser choice determines which storage backends you can use.

### Chromium Browsers (Full Support)

Chrome, Edge, Brave, and Arc all support the **File System Access API**, which lets Thought.Haus read and write files directly to a folder on your computer. This is the recommended setup — it requires no server and keeps everything local.

Chromium browsers also support **WebDAV** as an alternative storage backend.

### Firefox (WebDAV Only)

Firefox does not implement the File System Access API. To use Thought.Haus in Firefox, you need to connect to a **WebDAV server** that serves your notes folder. This can be a local server running on your machine or a remote one.

### Safari (Not Supported)

Safari does not support the File System Access API in a way that Thought.Haus can use, and is not currently supported.

## Why the File System Access API Matters

The File System Access API is what allows Thought.Haus to work as a true local-first app without any server component. When you grant the app access to a folder, it can:

- Read existing Markdown files as notes
- Write changes directly back to those files
- Create new files for new notes
- Watch for changes made by other applications

Without this API, a server-side component (like WebDAV) is needed to bridge the gap between the browser and your file system.

## Checking Your Browser

When you first open Thought.Haus, it detects your browser's capabilities and presents the appropriate storage options. If you're using a Chromium browser, you'll see the option to select a local folder. If you're on Firefox, you'll be prompted to enter WebDAV connection details.

## Minimum Versions

- **Chrome / Edge / Brave / Arc**: Version 86+ (File System Access API support)
- **Firefox**: Version 100+ (for modern CSS and JS features; WebDAV storage only)
