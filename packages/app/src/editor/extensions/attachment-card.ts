import { Node, type JSONContent } from "@tiptap/core";
import type {
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
  RenderContext,
} from "@tiptap/core";
import { isImageFile, getAttachmentURL } from "../../attachments/attachment-service.ts";

const FILE_EXT_RE = /\.([a-zA-Z0-9]+)$/;

/** Get file extension (uppercase) for display. */
function getExtLabel(filename: string): string {
  const m = filename.match(FILE_EXT_RE);
  return m ? m[1].toUpperCase() : "FILE";
}

/** Parse a local path like `./DIR/FILENAME` into dir + filename. */
function parseLocalPath(href: string): { dir: string; filename: string } | null {
  const match = href.match(/^\.\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { dir: match[1], filename: match[2] };
}

/**
 * Inline node for non-image file attachments.
 * Renders as a clickable card with file icon, name, and extension badge.
 * Markdown: `[label](./DIR/file.ext)`
 */
export const AttachmentCard = Node.create({
  name: "attachmentCard",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      href: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-attachment-card]', getAttrs: (el) => ({
      href: (el as HTMLElement).dataset.href,
      label: (el as HTMLElement).dataset.label,
    }) }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", { "data-attachment-card": "", "data-href": HTMLAttributes.href, "data-label": HTMLAttributes.label }, 0];
  },

  markdownTokenizer: {
    name: "attachmentCard",
    level: "inline",
    start: "[",
    tokenize(src: string) {
      // Match [label](./dir/file.ext) where ext is NOT an image
      const re = /^\[([^\]]+)\]\((\.\/[^)]+)\)/;
      const match = re.exec(src);
      if (!match) return undefined;
      const href = match[2];
      // Only match local paths (starts with ./)
      if (!href.startsWith("./")) return undefined;
      // Extract filename from path
      const filename = href.split("/").pop() ?? "";
      // Skip if this is an image (handled by Image extension)
      if (isImageFile(filename)) return undefined;
      return {
        type: "attachmentCard",
        raw: match[0],
        label: match[1],
        href,
      } as MarkdownToken;
    },
  },

  parseMarkdown(token: MarkdownToken, helpers: MarkdownParseHelpers) {
    return helpers.createNode("attachmentCard", { href: token.href, label: token.label });
  },

  renderMarkdown(node: JSONContent, _helpers: MarkdownRendererHelpers, _ctx: RenderContext) {
    const label = node.attrs?.label ?? "file";
    const href = node.attrs?.href ?? "";
    return `[${label}](${href})`;
  },

  addNodeView() {
    return ({ node }) => {
      const href = node.attrs.href as string;
      const label = node.attrs.label as string;
      const filename = href.split("/").pop() ?? label;
      const ext = getExtLabel(filename);

      let objectURL: string | null = null;

      // Card container
      const dom = document.createElement("span");
      dom.className = "attachment-card";
      dom.setAttribute("role", "link");
      dom.setAttribute("tabindex", "0");
      dom.title = `Open ${label}`;

      // File icon (Lucide "file" icon as inline SVG)
      const icon = document.createElement("span");
      icon.className = "attachment-card-icon";
      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>';
      dom.appendChild(icon);

      // Filename
      const nameEl = document.createElement("span");
      nameEl.className = "attachment-card-name";
      nameEl.textContent = label;
      dom.appendChild(nameEl);

      // Extension badge
      const badge = document.createElement("span");
      badge.className = "attachment-card-ext";
      badge.textContent = ext;
      dom.appendChild(badge);

      // Click to open
      const openFile = async (e: Event) => {
        e.preventDefault();
        const local = parseLocalPath(href);
        if (!local) return;
        try {
          if (!objectURL) {
            objectURL = await getAttachmentURL(local.dir, local.filename);
          }
          window.open(objectURL, "_blank");
        } catch {
          // ignore open errors
        }
      };

      dom.addEventListener("click", openFile);
      dom.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter") openFile(e);
      });

      return {
        dom,
        destroy() {
          if (objectURL) URL.revokeObjectURL(objectURL);
        },
      };
    };
  },
});
