---
title: Connecting Storage
description: Connect the clipper extension to your notes folder or WebDAV server.
---

## Overview

The clipper extension writes notes to the same storage location as the main Thought.Haus app. You need to configure the clipper to point to the same folder or WebDAV server.

## Local Folder (Chromium Only)

On Chromium browsers (Chrome, Edge, Brave, Arc), the clipper can write directly to a local folder using the File System Access API.

### Setup

1. Click the clipper extension icon
2. Select the **Local Folder** tab
3. Click **Choose Folder**
4. Navigate to and select your Thought.Haus notes folder
5. Grant read/write permission

### Permission Handling

The clipper stores the directory handle in its own IndexedDB database (separate from the main app). When the popup opens, it checks if the handle still has permission:

- If **granted**, the clipper works immediately
- If **not granted**, the browser shows a permission prompt — click "Allow" to re-grant access

Since the clipper popup is opened by a user gesture (clicking the icon or pressing the shortcut), the browser allows the permission request without additional interaction.

### Important Note

The clipper and main app store their directory handles independently. You need to select the same folder in both. They don't share the handle because browser extensions and web pages have separate storage contexts.

## WebDAV (All Browsers)

WebDAV storage works on all supported browsers, including Firefox.

### Setup

1. Click the clipper extension icon
2. Select the **WebDAV Server** tab
3. Enter your server details:
   - **URL** — same WebDAV URL used in the main app
   - **Username**
   - **Password**
4. Click **Connect**

The clipper tests the connection before saving. You'll see a specific error if the connection fails:

- **Authentication failed** — wrong username or password
- **Not found** — the URL doesn't point to a valid WebDAV directory
- **CORS error** — the server isn't configured to accept requests from browser extensions

### Credentials Storage

WebDAV credentials are stored in the extension's `browser.storage.local`. They persist across browser sessions and are accessible only to the extension.

## Changing Storage

To reconfigure the clipper's storage:

1. Open the clipper popup
2. Click the **Settings** button (visible in the clip view)
3. The setup screen reappears where you can choose a new folder or enter new WebDAV credentials

This clears the saved storage configuration but does not delete any notes.
