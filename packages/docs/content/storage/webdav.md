---
title: WebDAV Storage
description: Connect to a WebDAV server to store your notes, enabling cross-browser and cross-device access.
---

## Overview

Thought.Haus can store notes on any WebDAV server. This is the recommended option for Firefox users and for anyone who wants to access notes from multiple devices or browsers.

## Browser Support

WebDAV works in all supported browsers:

- **Google Chrome**, **Edge**, **Brave**, **Arc**
- **Firefox**

## Setting Up

1. Open Thought.Haus for the first time (or after disconnecting storage)
2. On the onboarding screen, select the **WebDAV** tab
3. Enter your WebDAV server details:
   - **Server URL** — the full URL to your WebDAV directory (e.g., `https://your-server.com/dav/notes/`)
   - **Username**
   - **Password**
4. Click **Connect**

Thought.Haus tests the connection before saving. If the test fails, you'll see a specific error message:

- **Authentication failed** — check your username and password
- **Not found** — verify the URL points to an existing directory
- **CORS error** — your WebDAV server needs to allow requests from the Thought.Haus origin (see CORS Configuration below)
- **Connection failed** — check that the server is reachable

## Compatible WebDAV Servers

Any standard WebDAV server should work. Common options include:

- **Nextcloud** — built-in WebDAV at `https://your-instance.com/remote.php/dav/files/USERNAME/path/`
- **ownCloud** — similar to Nextcloud
- **Apache mod_dav** — lightweight self-hosted option
- **Nginx with ngx_http_dav_module**
- **Caddy with WebDAV plugin**

## CORS Configuration

Since Thought.Haus runs in the browser, your WebDAV server must include CORS headers allowing requests from the app's origin. Required headers:

```
Access-Control-Allow-Origin: https://thought.haus
Access-Control-Allow-Methods: GET, PUT, DELETE, PROPFIND, MKCOL, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Depth
```

## How It Works

Thought.Haus uses standard WebDAV methods:

- **PROPFIND** — list files and read metadata
- **GET** — read file content
- **PUT** — write/update files
- **DELETE** — remove files
- **MKCOL** — create directories (for attachments)

Authentication uses HTTP Basic Auth. Your credentials are stored in the browser's IndexedDB — they never leave your machine except when authenticating with the server.

## Reconnecting

If the WebDAV server is unreachable when you open Thought.Haus, you'll see a reconnect screen with options to retry or change the server configuration. Your credentials are preserved so reconnecting is usually a single click.

## Disconnecting

To switch storage, open **Settings > Storage** and click **Change Storage**. This removes the saved credentials from your browser. Files on the server are not affected.
