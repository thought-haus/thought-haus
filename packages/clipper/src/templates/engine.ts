import type { TemplateContext } from "./variables.ts";
import { resolveVariable } from "./variables.ts";
import { applyFilter, parseFilterChain } from "./filters.ts";
import {
  generateFilename,
  serializeFrontMatter,
} from "@thought-haus/core";
import type { FrontMatter } from "@thought-haus/core";

export interface ClipTemplate {
  name: string;
  /** Filename pattern, e.g. "{{date}}--{{title|slug}}.md" */
  filename: string;
  /** Subfolder within notes directory (empty = root). */
  folder: string;
  /** Default tags to apply. */
  tags: string[];
  /** Extra frontmatter properties. */
  properties: Record<string, string>;
  /** Body template with {{variable}} placeholders. */
  body: string;
  /** URL pattern triggers (prefix match or regex). */
  triggers?: string[];
}

const VARIABLE_RE = /\{\{(\w+(?:\|[^}]+)?)\}\}/g;

/** Expand a template string by resolving variables and applying filters. */
export function expandTemplate(template: string, ctx: TemplateContext): string {
  return template.replace(VARIABLE_RE, (_match, expr: string) => {
    const parts = expr.split("|");
    const varName = parts[0].trim();
    let value = resolveVariable(varName, ctx);

    // Apply filters
    if (parts.length > 1) {
      const filterChain = parseFilterChain(parts.slice(1).join("|"));
      for (const filter of filterChain) {
        value = applyFilter(filter.name, value, filter.arg);
      }
    }

    return value;
  });
}

/** Generate the full clipped note content from a template and context. */
export function renderClip(
  template: ClipTemplate,
  ctx: TemplateContext,
  extraTags?: string[],
): { filename: string; content: string } {
  // Resolve filename
  const filename = expandTemplate(template.filename, ctx).trim() || generateFilename(ctx.now, ctx.metadata.title);

  // Build frontmatter
  const allTags = [...template.tags, ...(extraTags ?? [])];
  const properties: Record<string, string> = {};
  for (const [key, value] of Object.entries(template.properties)) {
    properties[key] = expandTemplate(value, ctx);
  }
  if (ctx.metadata.url) {
    properties.source = ctx.metadata.url;
  }
  if (ctx.metadata.author) {
    properties.author = ctx.metadata.author;
  }

  const frontMatter: FrontMatter = {
    title: ctx.metadata.title,
    date: ctx.now.toISOString(),
    tags: allTags,
    properties,
  };

  // Render body
  const body = expandTemplate(template.body, ctx);

  const content = serializeFrontMatter(frontMatter, body);

  return { filename, content };
}

/** Find the first template whose trigger matches the given URL. */
export function matchTemplate(url: string, templates: ClipTemplate[]): ClipTemplate | null {
  for (const t of templates) {
    if (!t.triggers || t.triggers.length === 0) continue;
    for (const trigger of t.triggers) {
      // Try prefix match first
      if (url.startsWith(trigger)) return t;
      // Try regex
      try {
        if (new RegExp(trigger).test(url)) return t;
      } catch {
        // Invalid regex, skip
      }
    }
  }
  return null;
}
