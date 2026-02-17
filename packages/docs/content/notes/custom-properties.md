---
title: Custom Properties
description: Adding arbitrary key-value pairs to note frontmatter for your own metadata needs.
---

## Adding Custom Properties

Beyond the standard fields (title, tags, created, modified), you can add any key-value pair to a note's frontmatter. These custom properties are preserved by Thought.Haus when saving — they won't be stripped out or overwritten.

```yaml
---
title: Project Alpha Spec
tags:
  - projects
created: 2024-03-22T13:18:56.000Z
modified: 2024-03-22T14:30:00.000Z
status: draft
priority: high
author: Jane Doe
due: 2024-04-15
---
```

## Use Cases

Custom properties are useful for adding structured metadata that goes beyond tags:

- **Status tracking** — `status: draft`, `status: published`, `status: archived`
- **Priority levels** — `priority: high`, `priority: low`
- **Attribution** — `author: Name`, `source: URL`
- **Dates** — `due: 2024-04-15`, `reviewed: 2024-03-20`
- **Categories** — `type: recipe`, `type: book-note`, `type: meeting`
- **Ratings** — `rating: 4`, `difficulty: beginner`

## How Custom Properties Work

Thought.Haus's frontmatter parser reads all key-value pairs in the YAML block, not just the ones it recognizes. When you save a note, the serializer writes back all properties — standard and custom — preserving values you set manually.

### Supported Value Types

Custom properties can be:

- **Strings** — `author: Jane Doe`
- **Numbers** — `rating: 4`
- **Booleans** — `published: true`
- **Dates** — `due: 2024-04-15`
- **Arrays** — `reviewers: [Alice, Bob]`

## Adding Properties via External Editors

Since notes are plain Markdown files, you can add custom properties by editing the frontmatter directly in any text editor. Open the `.md` file, add your key-value pairs between the `---` delimiters, and save. Thought.Haus will pick up the changes through its file watcher.

```markdown
---
title: My Note
tags: []
created: 2024-03-22T13:18:56.000Z
modified: 2024-03-22T13:18:56.000Z
my-custom-field: my value
---
```
