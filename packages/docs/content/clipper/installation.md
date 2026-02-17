---
title: Installing the Web Clipper
description: Install the Thought.Haus clipper extension on Chrome or Firefox to save web content as notes.
---

## Overview

The Thought.Haus Web Clipper is a browser extension that lets you clip web pages, articles, selections, and bookmarks directly into your notes folder.

## Chrome / Chromium Installation

The clipper supports all Chromium-based browsers: Chrome, Edge, Brave, and Arc.

### From Source

1. Clone or download the repository
2. Build the extension:
   ```
   npm run build:clipper
   ```
3. Open your browser's extensions page (`chrome://extensions`)
4. Enable **Developer mode**
5. Click **Load unpacked**
6. Select the `packages/clipper/dist-chrome/` directory

### Keyboard Shortcut

The extension registers two keyboard shortcuts:

- **Ctrl/Cmd + Shift + S** — open the clipper popup
- **Alt + Shift + S** — quick clip (uses last-used mode)

You can customize these in your browser's extension keyboard shortcuts settings.

## Firefox Installation

### From Source

1. Build the Firefox version:
   ```
   BROWSER=firefox npm run build:clipper
   ```
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select any file inside `packages/clipper/dist-firefox/`

Note: Temporary add-ons are removed when Firefox restarts. For permanent installation, the extension needs to be signed.

## First-Time Setup

After installing, click the extension icon to open the popup. On first use, you'll see the setup screen:

### Local Folder (Chromium Only)

1. Select the **Local Folder** tab
2. Click **Choose Folder**
3. Select the same folder you use in the Thought.Haus app
4. Grant read/write permission

### WebDAV (All Browsers)

1. Select the **WebDAV Server** tab
2. Enter the same WebDAV URL, username, and password you use in the app
3. Click **Connect**

The connection is tested before saving. The clipper shares the `@thought-haus/core` library with the main app, so notes are written in the same format.

## Browser Differences

| Feature | Chrome / Chromium | Firefox |
|---|---|---|
| Local folder storage | Yes | No |
| WebDAV storage | Yes | Yes |
| `Ctrl+Shift+S` shortcut | Yes | Yes |
| Quick clip shortcut | Yes | Yes |
