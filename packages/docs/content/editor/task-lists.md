---
title: Task Lists
description: Creating and using interactive task lists with checkboxes in your notes.
---

## Creating Task Lists

Task lists (also called checklists or to-do lists) let you add interactive checkboxes to your notes. Start a line with `- [ ] ` for an unchecked item or `- [x] ` for a checked item:

```markdown
- [ ] Buy groceries
- [ ] Review pull request
- [x] Send weekly update
- [ ] Book dentist appointment
```

You can also use the keyboard shortcut `Cmd/Ctrl + Shift + 9` to toggle a bullet list item into a task list item.

## Interacting With Checkboxes

In the editor, task list items render with clickable checkboxes. Click a checkbox to toggle it between checked and unchecked. The change is reflected in the underlying Markdown and auto-saved to the file.

## Mixing With Other Content

Task lists can be mixed freely with regular content in a note:

```markdown
## Sprint Planning

Some context about the sprint goals.

### Tasks

- [x] Design the new dashboard layout
- [ ] Implement API endpoint
- [ ] Write integration tests

### Notes

Remember to coordinate with the backend team.
```

## Nesting

Task list items can be nested by indenting with spaces:

```markdown
- [ ] Prepare presentation
  - [x] Write outline
  - [ ] Create slides
  - [ ] Practice run
- [ ] Send invitations
```

Each nested item has its own independent checkbox.

## Practical Uses

Task lists work well for:

- **Daily to-do lists** — Track tasks for the day and check them off as you go.
- **Project checklists** — Break projects into steps and monitor progress.
- **Meeting action items** — Record follow-ups and mark them done.
- **Packing lists** — Check off items as you pack.
- **Review checklists** — Step through a process or checklist systematically.

Since notes are saved as Markdown, your task lists are preserved exactly as you'd expect in any Markdown viewer.
