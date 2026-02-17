---
title: Custom Templates
description: Create your own clipper templates with variables, filters, and URL-based triggers.
---

## Template Structure

A custom template has the following fields:

| Field | Description |
|---|---|
| `name` | Display name in the template selector |
| `filename` | Filename pattern (e.g., `{{date}}--{{title\|slug}}.md`) |
| `folder` | Subfolder within your notes directory (empty for root) |
| `tags` | Default tags applied to clipped notes |
| `properties` | Extra frontmatter properties (values can use template variables) |
| `body` | The note body template |
| `triggers` | URL patterns for auto-selection (optional) |

## Variable Syntax

Use `{{variable}}` to insert dynamic values:

```
# {{title}}

Clipped from [{{domain}}]({{url}}) on {{time}}

{{content}}
```

See [Templates](/templates) for the full list of available variables.

## Filters

Apply filters to transform variable values using the pipe syntax: `{{variable|filter}}`.

### Available Filters

| Filter | Description | Example |
|---|---|---|
| `slug` | Convert to URL slug | `{{title\|slug}}` → `my-page-title` |
| `blockquote` | Prefix each line with `> ` | `{{selection\|blockquote}}` |
| `trim` | Remove leading/trailing whitespace | `{{content\|trim}}` |
| `uppercase` | Convert to uppercase | `{{title\|uppercase}}` |
| `lowercase` | Convert to lowercase | `{{title\|lowercase}}` |
| `truncate:N` | Limit to N characters with `...` | `{{description\|truncate:100}}` |
| `default:text` | Fallback if value is empty | `{{author\|default:Unknown}}` |
| `date:FORMAT` | Format a date string | `{{published\|date:YYYY-MM-DD}}` |

### Filter Chaining

Chain multiple filters with additional pipes:

```
{{title|lowercase|truncate:50}}
{{author|trim|default:Anonymous}}
```

Filters are applied left to right.

## URL Triggers

Triggers let a template auto-select when the page URL matches a pattern. Each trigger is a string that is tested as:

1. A **prefix match** — does the URL start with this string?
2. A **regular expression** — does the URL match this pattern?

### Examples

```
https://www.youtube.com/watch
https://youtu.be/
https://github.com/.*/issues/
```

The first matching template wins. If no triggers match, the default template for the selected clip mode is used.

## Filename Patterns

The `filename` field supports the same variables and filters:

```
{{date}}--{{title|slug}}.md
```

If the expanded filename is empty, a fallback filename is generated using the standard `YYYYMMDDTHHMMSS--slugified-title.md` format.

## Properties

The `properties` field supports template expansion in values:

```json
{
  "source": "{{url}}",
  "author": "{{author}}",
  "read_time": "{{words}} words"
}
```

The `source` and `author` properties are always added automatically, even if not specified in the template.
