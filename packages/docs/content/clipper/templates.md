---
title: Templates
description: How the clipper uses templates to structure clipped content into notes with frontmatter and formatted bodies.
---

## Overview

Templates define how clipped web content is structured into a note. Each template specifies the filename format, default tags, frontmatter properties, and body layout.

## Built-In Templates

The clipper includes six templates:

### Article

The default for article-mode clips. Captures the full extracted content with a source footer.

- **Tags:** `clipping`
- **Body:** The extracted article content followed by source URL and clip time

### Bookmark

A lightweight reference with just metadata and no body content.

- **Tags:** `bookmark`
- **Body:** The page description followed by source URL and clip time

### Selection

For clipping highlighted text. The selection is rendered as a blockquote.

- **Tags:** `clipping`
- **Body:** The selected text as a blockquote, followed by source URL and clip time

### Full Page

Captures the complete page body without content extraction.

- **Tags:** `clipping`
- **Body:** The full page content followed by source URL and clip time

### YouTube

Auto-selected when the URL matches `https://www.youtube.com/watch` or `https://youtu.be/`. Captures the video description and thumbnail.

- **Tags:** `clipping`, `video`
- **Trigger:** YouTube watch and short URLs
- **Body:** Video description, thumbnail image, and source footer

### Recipe

For clipping recipe pages with attribution.

- **Tags:** `clipping`, `recipe`
- **Body:** The extracted content with source, author, and clip time

## Template Variables

Templates use `{{variable}}` syntax. Available variables:

| Variable | Description |
|---|---|
| `{{title}}` | Page title |
| `{{url}}` | Page URL |
| `{{domain}}` | Domain name (e.g., `example.com`) |
| `{{author}}` | Author from meta tags |
| `{{description}}` | Page description |
| `{{published}}` | Publication date |
| `{{image}}` | Open Graph image URL |
| `{{content}}` | Extracted Markdown content |
| `{{selection}}` | Selected text as Markdown |
| `{{date}}` | Timestamp ID (e.g., `20240322T131856`) |
| `{{time}}` | ISO 8601 timestamp |
| `{{words}}` | Word count of content or selection |
| `{{siteName}}` | Site name from meta tags |
| `{{tags}}` | Keywords from meta tags |

## Note Structure

Each clipped note is generated with:

1. **Filename** — expanded from the template's filename pattern (default: `{{date}}--{{title|slug}}.md`)
2. **Frontmatter** — title, date, tags, and properties like `source` and `author`
3. **Body** — the template body with all variables expanded

The `source` (page URL) and `author` properties are always added to the frontmatter automatically.
