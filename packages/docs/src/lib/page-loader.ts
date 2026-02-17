import type { DocPage } from "../types.ts";

const cache = new Map<string, DocPage>();

const loaders: Record<string, () => Promise<DocPage>> = {
  // Getting Started
  "getting-started/what-is-thought-haus": () => import("virtual:content/getting-started/what-is-thought-haus"),
  "getting-started/browser-compatibility": () => import("virtual:content/getting-started/browser-compatibility"),
  "getting-started/setting-up-storage": () => import("virtual:content/getting-started/setting-up-storage"),
  "getting-started/creating-your-first-note": () => import("virtual:content/getting-started/creating-your-first-note"),
  "getting-started/installing-as-pwa": () => import("virtual:content/getting-started/installing-as-pwa"),
  // Notes
  "notes/creating-editing-deleting": () => import("virtual:content/notes/creating-editing-deleting"),
  "notes/note-format": () => import("virtual:content/notes/note-format"),
  "notes/frontmatter": () => import("virtual:content/notes/frontmatter"),
  "notes/custom-properties": () => import("virtual:content/notes/custom-properties"),
  "notes/auto-save": () => import("virtual:content/notes/auto-save"),
  "notes/external-editing": () => import("virtual:content/notes/external-editing"),
  // Editor
  "editor/overview": () => import("virtual:content/editor/overview"),
  "editor/text-formatting": () => import("virtual:content/editor/text-formatting"),
  "editor/task-lists": () => import("virtual:content/editor/task-lists"),
  "editor/note-linking": () => import("virtual:content/editor/note-linking"),
  "editor/attachments": () => import("virtual:content/editor/attachments"),
  // Organization
  "organization/tags": () => import("virtual:content/organization/tags"),
  "organization/favorites": () => import("virtual:content/organization/favorites"),
  "organization/sorting": () => import("virtual:content/organization/sorting"),
  "organization/search": () => import("virtual:content/organization/search"),
  "organization/command-palette": () => import("virtual:content/organization/command-palette"),
  // AI Assistant
  "ai-assistant/setup": () => import("virtual:content/ai-assistant/setup"),
  "ai-assistant/chat-interface": () => import("virtual:content/ai-assistant/chat-interface"),
  "ai-assistant/agent-tools": () => import("virtual:content/ai-assistant/agent-tools"),
  "ai-assistant/memory": () => import("virtual:content/ai-assistant/memory"),
  "ai-assistant/skills": () => import("virtual:content/ai-assistant/skills"),
  "ai-assistant/commands": () => import("virtual:content/ai-assistant/commands"),
  "ai-assistant/at-mentions": () => import("virtual:content/ai-assistant/at-mentions"),
  // Storage
  "storage/local-folder": () => import("virtual:content/storage/local-folder"),
  "storage/webdav": () => import("virtual:content/storage/webdav"),
  "storage/permissions": () => import("virtual:content/storage/permissions"),
  "storage/file-watching": () => import("virtual:content/storage/file-watching"),
  // Clipper
  "clipper/installation": () => import("virtual:content/clipper/installation"),
  "clipper/clip-modes": () => import("virtual:content/clipper/clip-modes"),
  "clipper/templates": () => import("virtual:content/clipper/templates"),
  "clipper/custom-templates": () => import("virtual:content/clipper/custom-templates"),
  "clipper/connecting-storage": () => import("virtual:content/clipper/connecting-storage"),
  // Reference
  "reference/keyboard-shortcuts": () => import("virtual:content/reference/keyboard-shortcuts"),
  "reference/settings": () => import("virtual:content/reference/settings"),
};

export async function loadPage(slug: string): Promise<DocPage | null> {
  const cached = cache.get(slug);
  if (cached) return cached;

  const loader = loaders[slug];
  if (!loader) return null;

  const page = await loader();
  cache.set(slug, page);
  return page;
}
