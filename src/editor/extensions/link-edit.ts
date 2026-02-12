import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import {
  showLinkPopover,
  hideLinkPopover,
  isPopoverVisible,
} from "../link-popover.ts";

const linkEditKey = new PluginKey("linkEdit");

/** Find the <a> DOM element at a given document position. */
function getLinkDomAtPos(
  view: EditorView,
  pos: number,
): HTMLAnchorElement | null {
  const resolved = view.state.doc.resolve(pos);
  const linkMark = resolved
    .marks()
    .find((m) => m.type.name === "link");
  if (!linkMark) return null;

  const domAtPos = view.domAtPos(pos);
  let node: Node | null = domAtPos.node;
  // domAtPos may return a text node — walk up to find the <a>
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  while (node && node !== view.dom) {
    if (
      node instanceof HTMLAnchorElement &&
      node.tagName === "A"
    ) {
      return node;
    }
    node = node.parentNode;
  }
  return null;
}

/** Read the href from the link mark at a given document position. */
function getLinkHrefAtPos(
  view: EditorView,
  pos: number,
): string | null {
  const resolved = view.state.doc.resolve(pos);
  const linkMark = resolved
    .marks()
    .find((m) => m.type.name === "link");
  return (linkMark?.attrs.href as string) ?? null;
}

/**
 * LinkEdit — TipTap Extension that shows a popover when clicking or
 * arrowing into a link. Provides edit/copy/open/unlink actions.
 */
export const LinkEdit = Extension.create({
  name: "linkEdit",

  addProseMirrorPlugins() {
    const editor = this.editor;
    let cursorDelayTimer: ReturnType<typeof setTimeout> | null = null;

    // ── Click handler plugin ──────────────────────────────────────
    const clickPlugin = new Plugin({
      key: linkEditKey,
      props: {
        handleClick(view, pos, event) {
          // Cmd/Ctrl+Click → open URL directly
          if (event.metaKey || event.ctrlKey) {
            const href = getLinkHrefAtPos(view, pos);
            if (href) {
              window.open(href, "_blank", "noopener");
              return true;
            }
            return false;
          }

          const href = getLinkHrefAtPos(view, pos);
          if (!href) {
            hideLinkPopover();
            return false;
          }

          const anchor = getLinkDomAtPos(view, pos);
          if (!anchor) return false;

          showLinkPopover({ href, anchorEl: anchor, editor });
          return true;
        },
      },
    });

    // ── Selection monitor plugin ──────────────────────────────────
    const selectionPlugin = new Plugin({
      view() {
        return {
          update(view, prevState) {
            const { from } = view.state.selection;
            const prevFrom = prevState.selection.from;

            // Only react to selection changes (keyboard navigation)
            if (from === prevFrom) return;

            if (cursorDelayTimer) {
              clearTimeout(cursorDelayTimer);
              cursorDelayTimer = null;
            }

            const href = getLinkHrefAtPos(view, from);
            if (href) {
              const anchor = getLinkDomAtPos(view, from);
              if (anchor) {
                cursorDelayTimer = setTimeout(() => {
                  showLinkPopover({ href, anchorEl: anchor, editor });
                  cursorDelayTimer = null;
                }, 150);
              }
            } else if (isPopoverVisible()) {
              cursorDelayTimer = setTimeout(() => {
                hideLinkPopover();
                cursorDelayTimer = null;
              }, 150);
            }
          },
          destroy() {
            if (cursorDelayTimer) {
              clearTimeout(cursorDelayTimer);
              cursorDelayTimer = null;
            }
            hideLinkPopover();
          },
        };
      },
    });

    return [clickPlugin, selectionPlugin];
  },
});
