---
title: Skills
description: Create reusable AI instruction sets with skill notes to teach the assistant specialized behaviors.
---

## What Are Skills?

Skills are notes tagged with `th-skill` that contain instructions for the AI assistant. They act as reusable capability definitions — when a skill is relevant to a conversation, the assistant can load it to follow specialized instructions.

## How Skills Work

1. The assistant sees a summary of all available skills in its system prompt (name, ID, and description)
2. When a skill is relevant, the assistant calls the `load_skill` tool to read the full skill body
3. The assistant follows the instructions in the skill note
4. If the skill body contains `[[note ID]]` links, the assistant can follow those to read related notes

## Creating a Skill

Create a note and add the `th-skill` tag. The skill should have:

- A **clear title** describing the capability (e.g., "Meeting Notes Formatter")
- A **description** property in the frontmatter — this short summary helps the assistant decide when to use the skill
- A **body** with detailed instructions for the assistant to follow

### Example Skill

```markdown
---
title: Meeting Notes Formatter
tags: th-skill
properties:
  description: Formats raw meeting notes into structured summaries with action items
---

When asked to format meeting notes:

1. Extract key discussion points as bullet points
2. List all action items with assignees
3. Note any decisions made
4. Add a "Next Steps" section at the end
```

## Skill Discovery

The assistant automatically sees all skill descriptions at the start of every conversation. You don't need to explicitly tell it about a skill — if you ask it to do something that matches a skill's description, it will load and apply that skill.

## Tips

- Keep the `description` property concise — it's included in every conversation's system prompt
- Put detailed instructions in the note body, which is only loaded when the skill is activated
- Link to reference notes using `[[note ID]]` syntax — the assistant can follow these links
- Use skills for repeatable tasks: formatting conventions, analysis frameworks, writing templates
