import type { ClipTemplate } from "./engine.ts";

export const ARTICLE_TEMPLATE: ClipTemplate = {
  name: "Article",
  filename: "{{date}}--{{title|slug}}.md",
  folder: "",
  tags: ["clipping"],
  properties: {},
  body: `{{content}}

---
Source: {{url}}
Clipped: {{time}}`,
};

export const BOOKMARK_TEMPLATE: ClipTemplate = {
  name: "Bookmark",
  filename: "{{date}}--{{title|slug}}.md",
  folder: "",
  tags: ["bookmark"],
  properties: {},
  body: `{{description}}

---
Source: {{url}}
Clipped: {{time}}`,
};

export const SELECTION_TEMPLATE: ClipTemplate = {
  name: "Selection",
  filename: "{{date}}--{{title|slug}}.md",
  folder: "",
  tags: ["clipping"],
  properties: {},
  body: `{{selection|blockquote}}

---
Source: {{url}}
Clipped: {{time}}`,
};

export const FULL_PAGE_TEMPLATE: ClipTemplate = {
  name: "Full Page",
  filename: "{{date}}--{{title|slug}}.md",
  folder: "",
  tags: ["clipping"],
  properties: {},
  body: `{{content}}

---
Source: {{url}}
Clipped: {{time}}`,
};

export const YOUTUBE_TEMPLATE: ClipTemplate = {
  name: "YouTube",
  filename: "{{date}}--{{title|slug}}.md",
  folder: "",
  tags: ["clipping", "video"],
  properties: {},
  body: `{{description}}

{{image}}

---
Source: {{url}}
Clipped: {{time}}`,
  triggers: ["https://www.youtube.com/watch", "https://youtu.be/"],
};

export const RECIPE_TEMPLATE: ClipTemplate = {
  name: "Recipe",
  filename: "{{date}}--{{title|slug}}.md",
  folder: "",
  tags: ["clipping", "recipe"],
  properties: {},
  body: `{{content}}

---
Source: {{url}}
Author: {{author}}
Clipped: {{time}}`,
};

export const DEFAULT_TEMPLATES: ClipTemplate[] = [
  ARTICLE_TEMPLATE,
  BOOKMARK_TEMPLATE,
  SELECTION_TEMPLATE,
  FULL_PAGE_TEMPLATE,
  YOUTUBE_TEMPLATE,
  RECIPE_TEMPLATE,
];

/** Get the appropriate default template for a clip mode. */
export function getDefaultTemplate(mode: string): ClipTemplate {
  switch (mode) {
    case "bookmark":
      return BOOKMARK_TEMPLATE;
    case "selection":
      return SELECTION_TEMPLATE;
    case "full-page":
      return FULL_PAGE_TEMPLATE;
    default:
      return ARTICLE_TEMPLATE;
  }
}
