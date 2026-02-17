import type { NavSection } from "../types.ts";

export const navigation: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "What is Thought.Haus", slug: "getting-started/what-is-thought-haus" },
      { title: "Browser Compatibility", slug: "getting-started/browser-compatibility" },
      { title: "Setting Up Storage", slug: "getting-started/setting-up-storage" },
      { title: "Creating Your First Note", slug: "getting-started/creating-your-first-note" },
      { title: "Installing as PWA", slug: "getting-started/installing-as-pwa" },
    ],
  },
  {
    title: "Notes",
    items: [
      { title: "Creating, Editing & Deleting", slug: "notes/creating-editing-deleting" },
      { title: "Note Format", slug: "notes/note-format" },
      { title: "Frontmatter", slug: "notes/frontmatter" },
      { title: "Custom Properties", slug: "notes/custom-properties" },
      { title: "Auto-Save", slug: "notes/auto-save" },
      { title: "External Editing", slug: "notes/external-editing" },
    ],
  },
  {
    title: "Editor",
    items: [
      { title: "Overview", slug: "editor/overview" },
      { title: "Text Formatting", slug: "editor/text-formatting" },
      { title: "Task Lists", slug: "editor/task-lists" },
      { title: "Note Linking", slug: "editor/note-linking" },
      { title: "Attachments", slug: "editor/attachments" },
    ],
  },
  {
    title: "Organization",
    items: [
      { title: "Tags", slug: "organization/tags" },
      { title: "Favorites", slug: "organization/favorites" },
      { title: "Sorting", slug: "organization/sorting" },
      { title: "Search", slug: "organization/search" },
      { title: "Command Palette", slug: "organization/command-palette" },
    ],
  },
  {
    title: "AI Assistant",
    items: [
      { title: "Setup", slug: "ai-assistant/setup" },
      { title: "Chat Interface", slug: "ai-assistant/chat-interface" },
      { title: "Agent Tools", slug: "ai-assistant/agent-tools" },
      { title: "Memory", slug: "ai-assistant/memory" },
      { title: "Skills", slug: "ai-assistant/skills" },
      { title: "Commands", slug: "ai-assistant/commands" },
      { title: "@-Mentions", slug: "ai-assistant/at-mentions" },
    ],
  },
  {
    title: "Storage",
    items: [
      { title: "Local Folder", slug: "storage/local-folder" },
      { title: "WebDAV", slug: "storage/webdav" },
      { title: "Permissions", slug: "storage/permissions" },
      { title: "File Watching", slug: "storage/file-watching" },
    ],
  },
  {
    title: "Web Clipper",
    items: [
      { title: "Installation", slug: "clipper/installation" },
      { title: "Clip Modes", slug: "clipper/clip-modes" },
      { title: "Templates", slug: "clipper/templates" },
      { title: "Custom Templates", slug: "clipper/custom-templates" },
      { title: "Connecting Storage", slug: "clipper/connecting-storage" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Keyboard Shortcuts", slug: "reference/keyboard-shortcuts" },
      { title: "Settings", slug: "reference/settings" },
    ],
  },
];
