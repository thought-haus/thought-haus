---
title: Installing as a PWA
description: How to install Thought.Haus as a Progressive Web App on desktop and mobile for quick access and offline use.
---

## What is a PWA?

A Progressive Web App (PWA) is a website that can be installed on your device like a native application. When installed, Thought.Haus gets its own window (no browser chrome), its own icon in your dock or taskbar, and can launch instantly.

## Installing on Desktop

### Chrome / Edge / Brave

1. Open Thought.Haus in your browser.
2. Look for the **install icon** in the address bar (usually a monitor with a down arrow, or a `+` icon).
3. Click it and confirm the installation.
4. Thought.Haus will open in its own window and appear in your application launcher.

Alternatively, open the browser menu (three dots) and look for **Install Thought.Haus** or **Install app**.

### Arc

In Arc, installed PWAs appear as **Boost** sites or can be added via **Add to Desktop** from the site menu.

## Installing on Mobile

### Android (Chrome)

1. Open Thought.Haus in Chrome.
2. Tap the browser menu (three dots).
3. Tap **Add to Home screen** or **Install app**.
4. Confirm the installation.

Note: On mobile, Thought.Haus requires a WebDAV backend since mobile browsers don't support the File System Access API for local folder access.

### iOS

Safari is not supported, so PWA installation on iOS is not currently available.

## Benefits of Installing as a PWA

- **Dedicated window** — No tabs, bookmarks bar, or other browser UI. Just your notes.
- **Quick launch** — Open Thought.Haus from your dock, taskbar, or home screen like any other app.
- **Offline access** — The app shell is cached by the service worker, so the interface loads even without an internet connection. Your notes are already local, so they're always available.
- **Automatic updates** — The service worker updates the app in the background. You always get the latest version.

## Uninstalling

To remove the PWA, right-click its icon and choose **Uninstall** (the exact wording varies by OS). Your notes are not affected — they remain in the folder or WebDAV server you configured.
