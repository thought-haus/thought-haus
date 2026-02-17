---
title: "@-Mentions"
description: Reference notes in AI conversations using @-mentions to include their content as context.
---

## Overview

Use `@`-mentions to include the full content of a note in your message to the AI assistant. This is useful when you want the assistant to work with a specific note that isn't currently open.

## Syntax

Wrap a note title in `@"..."`:

```
@"Project Roadmap" What are the next milestones?
```

You can mention multiple notes in a single message:

```
Compare @"Q1 Report" with @"Q2 Report" and highlight the differences.
```

## Autocomplete

When you type `@` followed by a `"` in the chat input, a popup appears showing matching notes. The list filters as you type the title. Use the arrow keys to navigate and **Enter** to select a note.

Only non-conversation notes appear in the autocomplete list (conversation notes tagged `th-agent-conversation` are excluded).

## How It Works

When you send a message containing `@`-mentions:

1. Each `@"Title"` pattern is matched against your notes by title (case-insensitive)
2. Matched notes are read from storage
3. The mention is expanded to include the full note body inline:
   ```
   [Note: "Project Roadmap"]:
   <full note content here>
   [End of note]
   ```
4. The expanded message is sent to the AI
5. In the chat history, your message displays with the original `@"Title"` form for readability

If a title doesn't match any note, the `@"Title"` text is left as-is.

## Tips

- Use `@`-mentions when you want the assistant to analyze, summarize, or compare specific notes
- The note content is sent as part of your message, so the assistant sees it in full context
- Combine with slash commands: `/weekly-summary @"Monday Notes" @"Friday Notes"`
- The currently open note is already included as context automatically — you only need `@`-mentions for other notes
