---
title: Memory
description: How the AI assistant remembers context across conversations using memory notes.
---

## How Memory Works

The AI assistant can maintain persistent memory across conversations using **memory notes** — regular notes tagged with `th-agent-memory`.

Every time you start a conversation, the assistant's system prompt includes the content of all your memory notes (up to 8,000 characters total, prioritizing the most recently modified).

## Creating Memory Notes

There are two ways to create memory notes:

### Ask the Assistant

Tell the assistant something like "Remember that I prefer bullet points for meeting notes" or "Save a memory that project X uses Python 3.11." The assistant will create a note tagged `th-agent-memory` containing the information.

### Create Manually

Create a note yourself and add the tag `th-agent-memory`. Write whatever context you want the assistant to always have — preferences, project details, recurring instructions, or reference information.

## What to Store in Memory

Memory notes are best for:

- **Personal preferences** — writing style, formatting conventions, response length
- **Project context** — tech stacks, team members, key decisions
- **Recurring instructions** — "Always use ISO dates", "Summarize in 3 bullets"
- **Reference data** — API endpoints, version numbers, naming conventions

## Managing Memory

Memory notes are regular notes. You can:

- **Edit** them to update the information
- **Delete** them to remove context the assistant no longer needs
- **Tag** them with additional tags for your own organization
- **Find** them by searching for the `th-agent-memory` tag in the sidebar

Since the total memory is capped at 8,000 characters, keep memory notes concise. The most recently modified notes take priority if the total exceeds the limit.
