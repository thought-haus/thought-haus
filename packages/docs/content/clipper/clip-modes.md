---
title: Clip Modes
description: The four clip modes — Article, Selection, Full Page, and Bookmark — and when to use each one.
---

## Overview

The clipper offers four modes for capturing web content. Each mode extracts different content from the page and pairs with a default template.

## Article

Extracts the main article content from the page using Mozilla's Readability algorithm. This strips away navigation, ads, sidebars, and other non-content elements to produce clean Markdown.

**Best for:** Blog posts, news articles, documentation pages — any page with a clear main content area.

**What's captured:**
- Article body converted to Markdown
- Page title (from Open Graph or document title)
- Author (from meta tags)
- Description and other metadata

If Readability can't identify the article content, the clipper falls back to capturing the full page body.

## Selection

Clips only the text you've selected on the page. The selected HTML is converted to Markdown, preserving formatting like headings, links, bold/italic, lists, and code blocks.

**Best for:** Capturing a specific paragraph, quote, code snippet, or section from a longer page.

**What's captured:**
- The selected HTML, converted to Markdown
- The selection is placed in the `{{selection}}` template variable and rendered as a blockquote by default

## Full Page

Captures the entire page body as Markdown. Unlike Article mode, this includes everything — navigation, footers, sidebars — without any content extraction or filtering.

**Best for:** Pages where you want a complete snapshot, or where Readability doesn't extract the right content.

## Bookmark

Saves only the page metadata without any body content. Creates a lightweight reference note with the URL, title, and description.

**Best for:** Saving links for later reference, building a reading list, or cataloging resources without full content.

## Changing Modes

Select a mode from the dropdown at the top of the clipper popup. The template automatically switches to match the selected mode:

| Mode | Default Template |
|---|---|
| Article | Article template |
| Selection | Selection template |
| Full Page | Full Page template |
| Bookmark | Bookmark template |

If a URL trigger matches one of the built-in templates (e.g., YouTube), that template is auto-selected instead.
