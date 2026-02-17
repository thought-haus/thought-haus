---
title: Permissions
description: How Thought.Haus handles browser permissions for local folder access and what to do when permission expires.
---

## Local Folder Permissions

When using local folder storage, Thought.Haus needs **read and write** permission to your chosen folder through the File System Access API.

### Initial Permission

The first time you pick a folder, the browser shows a permission dialog asking for read and write access. You must grant this for Thought.Haus to work.

### Permission Persistence

The browser stores the directory handle in IndexedDB so Thought.Haus can reconnect to your folder on subsequent visits. However, the read/write permission is **not permanently granted** — browsers revoke it when you close the tab or after a period of inactivity.

### Re-granting Permission

When you return to Thought.Haus and the permission has expired, you'll see a **re-permission screen** showing the name of your previously selected folder. Click the button to re-grant access. This requires a user gesture (a click) — the browser cannot silently regain access.

If you decline or the handle is no longer valid, you'll be taken back to the onboarding screen to choose a new folder.

### How Permission Checks Work

On app startup, Thought.Haus:

1. Loads the saved directory handle from IndexedDB
2. Calls `queryPermission({ mode: "readwrite" })` — this check does **not** require a user gesture
3. If the result is `"granted"`, the app opens normally
4. If not granted, the re-permission screen is shown
5. Clicking the re-open button calls `requestPermission({ mode: "readwrite" })` — this **does** require a user gesture

## WebDAV Permissions

WebDAV storage uses standard HTTP authentication. Credentials are stored in IndexedDB and sent as HTTP Basic Auth headers with each request. No browser permission dialogs are involved.

If the server becomes unreachable or credentials become invalid, Thought.Haus shows a reconnect screen where you can retry or update the server configuration.

## Security Model

- **No cloud accounts** — Thought.Haus has no server. Your data stays on your machine (local) or your server (WebDAV).
- **No third-party access** — API keys for AI features are stored in `localStorage` and sent directly to the provider.
- **Scoped access** — local folder permission is limited to the single directory you selected. Thought.Haus cannot access other files on your system.
- **User-controlled** — you can revoke access at any time by disconnecting storage in Settings or revoking the permission through your browser's site settings.
