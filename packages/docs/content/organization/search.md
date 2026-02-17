---
title: Search
description: Full-text search across all your notes with fuzzy matching and prefix search, powered by MiniSearch.
---

## Full-Text Search

Thought.Haus includes a full-text search engine that indexes all your notes. Search across titles, content, and tags to find any note in your collection.

## How to Search

Click the search field in the notes list header or use the [command palette](/organization/command-palette) (`Cmd/Ctrl+K`) to start searching. As you type, results update in real time.

## Search Features

### Prefix Matching

You don't need to type a complete word. Typing the beginning of a word matches all words that start with those characters. For example, `proj` matches "project", "projection", and "projects".

### Fuzzy Matching

Search is tolerant of small typos. If you mistype a character or two, the engine still finds relevant results. For example, `meetting` would still match notes containing "meeting".

### Ranked Results

Results are ranked by relevance. Notes where the search term appears in the title are ranked higher than notes where it only appears in the body. Multiple matches in a single note also boost its ranking.

## Search Index

The search engine uses [MiniSearch](https://lucaong.github.io/minisearch/) to maintain an in-memory index of all your notes. The index is:

- **Built incrementally** — When a note is added, modified, or deleted, only that note's entry in the index is updated. The entire index is not rebuilt.
- **Persisted to IndexedDB** — The index is serialized and stored in the browser's IndexedDB so it doesn't need to be rebuilt from scratch on every page load.
- **Fast** — Searches return results in milliseconds, even across hundreds of notes.

## What Gets Indexed

The search index includes:

- **Note titles** — Weighted higher in search ranking.
- **Note content** — The full Markdown body of each note.
- **Tags** — Searchable as part of the note's metadata.

## Clearing Search

Clear the search field to return to the full notes list. The notes list returns to your current sort order and any active tag filter.
