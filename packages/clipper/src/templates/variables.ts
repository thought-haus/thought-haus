import type { PageMetadata } from "../content/extractor.ts";
import { formatTimestampId } from "@thought-haus/core";

export interface TemplateContext {
  /** Page metadata from extraction. */
  metadata: PageMetadata;
  /** Extracted Markdown content. */
  content: string;
  /** Selected text (if any). */
  selection: string;
  /** Collected highlights (if any). */
  highlights: string;
  /** Current date/time for the clip. */
  now: Date;
}

/** Resolve a template variable name to its value. */
export function resolveVariable(name: string, ctx: TemplateContext): string {
  switch (name) {
    case "title":
      return ctx.metadata.title;
    case "url":
      return ctx.metadata.url;
    case "domain":
      return ctx.metadata.domain;
    case "author":
      return ctx.metadata.author ?? "";
    case "description":
      return ctx.metadata.description ?? "";
    case "published":
      return ctx.metadata.published ?? "";
    case "image":
      return ctx.metadata.image ?? "";
    case "tags":
      return ctx.metadata.keywords.join(", ");
    case "content":
      return ctx.content;
    case "selection":
      return ctx.selection;
    case "highlights":
      return ctx.highlights;
    case "date":
      return formatTimestampId(ctx.now);
    case "time":
      return ctx.now.toISOString();
    case "words": {
      const text = ctx.content || ctx.selection;
      return String(text.split(/\s+/).filter(Boolean).length);
    }
    case "siteName":
      return ctx.metadata.siteName ?? "";
    default:
      return "";
  }
}
