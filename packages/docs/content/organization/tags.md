---
title: Tags
description: How to use tags to organize your notes in Thought.Haus, including adding, removing, and filtering by tag.
---

## Tags as the Primary Organization Tool

Thought.Haus uses tags as the sole mechanism for organizing notes. There are no folders or notebooks — tags provide a flexible, non-hierarchical way to categorize your notes. A single note can have many tags, letting it belong to multiple categories simultaneously.

## Adding Tags

Tags are defined in a note's YAML frontmatter as an array:

```yaml
---
title: Meeting Notes
tags:
  - work
  - project-alpha
  - meetings
---
```

You can add tags through the Thought.Haus UI using the tag interface in the editor, or by editing the frontmatter directly in any text editor.

## Tag Sidebar

The sidebar displays a list of all tags used across your notes, along with a count of how many notes have each tag. Clicking a tag filters the notes list to show only notes with that tag.

### Tag Counts

Each tag in the sidebar shows a count badge indicating how many notes use it. This gives you a quick overview of how your notes are distributed across categories.

## Filtering by Tag

When you click a tag in the sidebar, the notes list filters to show only notes tagged with that value. This is a quick way to browse a specific topic or category. Click the tag again (or clear the filter) to return to the full list.

## Tag Naming

Tags are plain strings. Common conventions include:

- **Lowercase with hyphens** — `meeting-notes`, `project-alpha`
- **Hierarchical with slashes** — `work/project-alpha`, `personal/health`
- **Simple single words** — `journal`, `ideas`, `recipes`

Choose whatever convention works for you — Thought.Haus treats tags as opaque strings and doesn't enforce a format.

## Removing Tags

Remove a tag from a note by deleting it from the tags array in the UI or in the frontmatter. If no other notes use that tag, it disappears from the sidebar automatically.

## Special Tags

Thought.Haus uses one reserved tag internally:

- **`th-agent-conversation`** — Used to identify notes that store AI assistant conversations. These are managed by the agent system and appear as conversation history.

Avoid using tags prefixed with `th-` for your own notes to prevent conflicts with internal features.
