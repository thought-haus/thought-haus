---
title: Note Linking
description: How to link between notes using the [[note-id]] syntax with autocomplete suggestions.
---

## Linking Between Notes

Thought.Haus supports wiki-style note linking using double-bracket syntax. This lets you connect related notes and navigate between them with a click.

## Syntax

To link to another note, wrap its timestamp ID in double brackets:

```markdown
See my notes from the [[20240322T131856]] meeting.
```

When rendered in the editor, this appears as a clickable widget showing the linked note's title instead of the raw ID.

## Autocomplete

You don't need to memorize or type note IDs manually. When you type `[[`, the editor opens an autocomplete dropdown showing your notes. As you continue typing, the list filters to match:

- Type part of a note's title to filter by name
- Type a timestamp prefix to filter by ID
- Use arrow keys to navigate the suggestions
- Press `Enter` or click to insert the link

The autocomplete searches across all your notes, making it quick to find and link to any note in your collection.

## How Links Render

In the editor, note links are rendered as inline widgets that display:

- The linked note's **title** (resolved from the ID)
- A visual style that distinguishes them from regular text

Links are clickable — clicking one navigates to the linked note, opening it in the editor.

## Link Stability

Links use the note's timestamp ID (`20240322T131856`), not the title. This means links remain valid even if you rename the linked note. The title displayed in the link widget updates automatically to reflect the current title.

## Practical Uses

Note linking is useful for:

- **Meeting notes** — Link to related project notes or previous meeting notes.
- **Research** — Connect sources, references, and analysis across notes.
- **Journals** — Reference past entries from current ones.
- **Project documentation** — Link specs, designs, and task lists together.
- **Personal wikis** — Build a web of interconnected notes on any topic.

## In Markdown Files

On disk, note links are stored as `[[20240322T131856]]` in the Markdown. If you open the file in another editor, you'll see the raw ID. The clickable rendering is a Thought.Haus editor feature.
