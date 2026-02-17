---
title: Slash Commands
description: Use slash commands to invoke custom instructions from your notes when chatting with the AI assistant.
---

## What Are Slash Commands?

Slash commands let you trigger custom AI instructions stored in your notes. Any note tagged with `th-command` becomes a slash command. The command name is derived from the note's title, converted to a URL-friendly slug.

## Using a Slash Command

Type `/` followed by the command name in the AI chat input:

```
/meeting-notes Please format the notes from today's standup
```

The text after the command name is passed as the user's message. The command note's body is injected into the assistant's system prompt as additional instructions.

## Creating a Command

1. Create a new note
2. Add the `th-command` tag
3. Give it a descriptive title (e.g., "Meeting Notes")
4. Write the instructions in the body

The command slug is derived from the title: "Meeting Notes" becomes `/meeting-notes`.

### Example Command

```markdown
---
title: Weekly Summary
tags: th-command
---

Summarize the user's message or referenced notes into a weekly summary format:

- Start with a one-line overview
- List accomplishments as bullet points
- List blockers or challenges
- End with priorities for next week

Keep the tone professional but concise.
```

This command would be invoked as `/weekly-summary`.

## Autocomplete

When you type `/` in the chat input, a popup appears showing matching commands. Use the arrow keys to navigate and **Enter** to select. The popup filters as you type the command name.

## How It Works

When you send a message starting with a slash command:

1. The command slug is matched against all `th-command` notes
2. The matched note's body is loaded
3. The body is injected into the system prompt with instructions to follow it
4. Your message text (after the command name) is sent as the user message
