# Thought.Haus

A local-first, browser-based note-taking app. Notes are stored as plain Markdown
files in a folder you choose on your device using the File System Access API or
available remotely with WebDAV access. No server, no accounts, no sync.

To get started, visit <https://thought.haus>.

## Packages

This is an npm workspaces monorepo with three packages:

| Package | Description |
|---------|-------------|
| `@thought-haus/app` | Main web app — Preact + TipTap + MiniSearch |
| `@thought-haus/core` | Shared library — storage backends, note types, frontmatter, filename utils |
| `@thought-haus/clipper` | Browser extension for clipping web content into notes |

## Features

- **Plain Markdown files**: Notes are just `.md` files with YAML frontmatter.
  Bring your own folder, take your files anywhere.
- **Rich editor**: TipTap-based editor with formatting, task lists, code blocks,
  block quotes, and smart typography.
- **Note linking**: Link between notes with `[[id]]` syntax and autocomplete.
- **Tags**: Organize notes with tags. Filter and browse by tag in the sidebar.
- **Full-text search**: Fuzzy and prefix matching across titles, tags, and
  content. Command palette (Cmd/Ctrl+K) for quick navigation.
- **Favorites**: Pin notes for quick access with drag-and-drop reordering.
- **Attachments**: Drag-and-drop or paste images and files into notes. Images
  render inline; other files show as download cards.
- **Custom properties**: Add arbitrary key-value metadata to any note.
- **AI assistant**: Built-in chat panel with tool use. Can read, create, edit,
  search, and delete notes. Supports Anthropic and OpenAI models.
- **Web clipper**: Browser extension to clip articles, selections, bookmarks,
  and full pages as Markdown notes. Supports customizable templates with
  URL-based triggers.
- **WebDAV support**: Optionally connect to a WebDAV server (Nextcloud, etc.)
  instead of a local folder.
- **Dark mode**: Light and dark themes with system preference detection.
- **File watching**: Detects external changes to your notes folder
  automatically.

## Browser Support

- **Chromium** (Chrome, Edge, Brave, Arc) — local folder + WebDAV
- **Firefox** — WebDAV only (no File System Access API)

## Development

```
npm install
npm run dev
```

### Build

```
npm run build              # app (tsc + vite)
npm run build:clipper      # clipper extension (Chrome)
BROWSER=firefox npm run build:clipper  # clipper extension (Firefox)
```

### Testing

```
npm test
```

## License

[AGPLv3](LICENSE) — Copyright (C) 2026 Greg Bell
