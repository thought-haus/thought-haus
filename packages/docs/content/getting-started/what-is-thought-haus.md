---
title: What is Thought.Haus?
description: An overview of Thought.Haus, a local-first, browser-based note-taking app that stores notes as plain Markdown files.
---

## A Local-First Note-Taking App

Thought.Haus is a browser-based note-taking application built around a simple idea: your notes belong to you, on your machine, in a format you control. There are no accounts to create, no cloud services to trust, and no proprietary formats to worry about.

Notes are stored as plain Markdown files in a folder you choose on your local file system. You can open that same folder in any text editor, back it up however you like, and keep your notes forever — even if Thought.Haus disappears tomorrow.

## Core Philosophy

### Plain Markdown, No Lock-In

Every note is a standard `.md` file with optional YAML frontmatter. There is no database, no binary blob, and no hidden metadata. Your notes are readable and editable in any text editor or Markdown tool.

### No Accounts, No Sync

Thought.Haus never asks you to sign up or sign in. It connects directly to a folder on your computer (or a WebDAV server) and reads and writes files there. If you want to sync notes across devices, use any file-syncing tool you already trust — Syncthing, Dropbox, iCloud Drive, or a self-hosted WebDAV server.

### Browser-Native

The app runs entirely in your browser. On Chromium-based browsers (Chrome, Edge, Brave, Arc) it uses the File System Access API to read and write files directly. On Firefox it connects via WebDAV. You can also install it as a Progressive Web App for a more native feel.

## Key Features

- **Rich Markdown editing** — A TipTap-powered editor that renders Markdown as you type, with support for headings, lists, code blocks, task lists, and more.
- **Full-text search** — Fuzzy and prefix-based search across all your notes, powered by MiniSearch.
- **Note linking** — Link between notes using `[[note-id]]` syntax with autocomplete suggestions.
- **Tags** — Organize notes with tags defined in frontmatter. Filter and browse by tag in the sidebar.
- **Attachments** — Drag and drop images and files into notes. Images render inline; other files appear as download cards.
- **Favorites** — Pin frequently used notes to the top of the sidebar with drag-and-drop reordering.
- **Command palette** — Press `Cmd/Ctrl+K` to quickly find and jump to any note.
- **AI assistant** — Chat with an AI that has context about your notes, with conversations saved as notes.
- **PWA support** — Install as a desktop or mobile app for quick access and offline use.

## Who Is It For?

Thought.Haus is for anyone who wants a fast, private, no-fuss place to write and organize notes — without handing their thoughts to a cloud service. It works well for personal journals, meeting notes, project documentation, research, and daily writing.
