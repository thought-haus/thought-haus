import Image from "@tiptap/extension-image";
import { getAttachmentURL } from "../../attachments/attachment-service.ts";

/** Parse a local attachment path like `./DIR/FILENAME` into dir + filename. */
function parseLocalPath(src: string): { dir: string; filename: string } | null {
  const match = src.match(/^\.\/([^/]+)\/(.+)$/);
  if (!match) return null;
  return { dir: match[1], filename: match[2] };
}

/**
 * Extends the base TipTap Image node to resolve local `./` paths
 * to object URLs for display, while preserving the relative path in markdown.
 */
export const AttachmentImage = Image.extend({
  addNodeView() {
    return ({ node }) => {
      const src = node.attrs.src as string;
      const alt = (node.attrs.alt as string) ?? "";
      const dom = document.createElement("img");
      dom.alt = alt;
      dom.style.maxWidth = "100%";

      let objectURL: string | null = null;

      const local = parseLocalPath(src);
      if (local) {
        // Local attachment — resolve to object URL
        dom.style.minHeight = "48px";
        dom.style.background = "var(--color-surface)";
        getAttachmentURL(local.dir, local.filename)
          .then((url) => {
            objectURL = url;
            dom.src = url;
            dom.style.minHeight = "";
            dom.style.background = "";
          })
          .catch(() => {
            dom.alt = `[missing: ${src}]`;
            dom.style.minHeight = "";
            dom.style.background = "";
          });
      } else {
        // External URL — use directly
        dom.src = src;
      }

      return {
        dom,
        destroy() {
          if (objectURL) URL.revokeObjectURL(objectURL);
        },
      };
    };
  },
});
