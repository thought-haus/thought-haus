---
title: Agent Tools
description: What the AI assistant can do — reading, searching, creating, editing, and deleting notes, plus running JavaScript.
---

## Overview

The AI assistant has access to eight tools that let it interact with your notes. When the assistant uses a tool, you'll see a collapsible tool call in the chat showing what it did and the result.

## Available Tools

### read_note

Reads the full content of a note by its ID. Returns the title, ID, tags, and body text. The assistant uses this to look at specific notes you mention or that come up in search results.

### create_note

Creates a new note with a title, body, and optional tags. The note gets a timestamp-based ID and filename following the standard `YYYYMMDDTHHMMSS--slugified-title.md` format. The note is immediately added to the search index.

### edit_note

Replaces the body of an existing note while preserving its frontmatter (title, tags, properties). Useful for updating or appending content to notes.

### delete_note

Permanently deletes a note by its ID. The note is removed from the filesystem, the in-memory store, and the search index.

### search_notes

Searches your notes using full-text search. Returns up to 10 results ranked by relevance, showing each note's title, ID, and search score. The assistant uses this to find relevant notes before answering questions.

### list_notes

Lists notes, optionally filtered by tag. Returns up to 50 notes sorted by most recent first. Without a tag filter, it lists all notes. Useful for browsing or getting an overview of a specific category.

### load_skill

Loads a skill note (tagged `th-skill`) by its ID. Skills are reusable instruction sets that guide the assistant's behavior for specific tasks. See [Skills](/skills) for details.

### run_javascript

Executes JavaScript code in the browser. The code runs in an async context, so you can use `await`. Single expressions return their value automatically; multi-statement code can use `return`. This tool enables the assistant to perform computations, manipulate data, or interact with browser APIs.
