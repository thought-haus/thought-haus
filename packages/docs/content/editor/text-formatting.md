---
title: Text Formatting
description: All the text formatting options available in the Thought.Haus editor, from bold and italic to code blocks.
---

## Inline Formatting

### Bold

Wrap text in double asterisks or use the keyboard shortcut:

- Markdown: `**bold text**`
- Shortcut: `Cmd/Ctrl + B`

### Italic

Wrap text in single asterisks or underscores:

- Markdown: `*italic text*` or `_italic text_`
- Shortcut: `Cmd/Ctrl + I`

### Strikethrough

Wrap text in double tildes:

- Markdown: `~~strikethrough~~`
- Shortcut: `Cmd/Ctrl + Shift + X`

### Inline Code

Wrap text in backticks:

- Markdown: `` `code` ``
- Shortcut: `Cmd/Ctrl + E`

## Headings

Start a line with one or more `#` characters followed by a space. The editor supports six heading levels:

```markdown
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
```

Headings are rendered with decreasing size and weight. In most notes, `##` (Heading 2) is a good starting point since the note title functions as the top-level heading.

## Lists

### Bullet Lists

Start a line with `- ` or `* `:

```markdown
- First item
- Second item
  - Nested item
```

Shortcut: `Cmd/Ctrl + Shift + 8`

### Ordered Lists

Start a line with `1. `:

```markdown
1. First step
2. Second step
3. Third step
```

Shortcut: `Cmd/Ctrl + Shift + 7`

Lists can be nested by indenting with spaces or tabs. The editor handles indentation and numbering automatically.

## Blockquotes

Start a line with `> `:

```markdown
> This is a blockquote.
> It can span multiple lines.
```

Blockquotes are rendered with a left border and slightly indented styling. They can contain other formatting like bold, italic, and lists.

## Code Blocks

Wrap multi-line code in triple backticks. You can optionally specify a language for syntax indication:

````markdown
```javascript
function hello() {
  console.log("Hello, world!");
}
```
````

The editor renders code blocks in a monospace font with a distinct background.

## Horizontal Rules

Type `---` on its own line to insert a horizontal divider:

```markdown
Content above

---

Content below
```

## Links

Paste a URL or use Markdown link syntax:

```markdown
[Link text](https://example.com)
```

URLs pasted directly are automatically converted to clickable links.
