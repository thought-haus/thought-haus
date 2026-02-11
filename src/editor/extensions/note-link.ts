import { Node, type JSONContent } from "@tiptap/core";
import type {
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
  RenderContext,
} from "@tiptap/core";
import { resolveNoteLink, NOTE_LINK_RE } from "../note-links.ts";
import { selectedNoteId } from "../../lib/app-state.ts";

/**
 * TipTap inline node for [[YYYYMMDDTHHMMSS]] note links.
 * Renders as a clickable span that navigates to the linked note.
 */
export const NoteLink = Node.create({
  name: "noteLink",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      noteId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-note-link]', getAttrs: (el) => ({ noteId: (el as HTMLElement).dataset.noteLink }) }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", { "data-note-link": HTMLAttributes.noteId }, 0];
  },

  markdownTokenizer: {
    name: "noteLink",
    level: "inline",
    start: "[[",
    tokenize(src: string) {
      const re = new RegExp(`^${NOTE_LINK_RE.source}`);
      const match = re.exec(src);
      if (!match) return undefined;
      return {
        type: "noteLink",
        raw: match[0],
        noteId: match[1],
      } as MarkdownToken;
    },
  },

  parseMarkdown(token: MarkdownToken, helpers: MarkdownParseHelpers) {
    return helpers.createNode("noteLink", { noteId: token.noteId });
  },

  renderMarkdown(node: JSONContent, _helpers: MarkdownRendererHelpers, _ctx: RenderContext) {
    return `[[${node.attrs?.noteId}]]`;
  },

  addNodeView() {
    return ({ node }) => {
      const noteId = node.attrs.noteId as string;
      const { title, exists } = resolveNoteLink(noteId);

      const dom = document.createElement("span");
      dom.className = exists ? "note-link" : "note-link-dead";
      dom.textContent = exists ? title : `${noteId} (not found)`;
      dom.dataset.noteId = noteId;
      dom.setAttribute("role", "link");
      dom.setAttribute("tabindex", "0");
      dom.title = exists ? `Go to: ${title}` : `Broken link: ${noteId}`;

      const navigate = (e: Event) => {
        e.preventDefault();
        if (exists) {
          selectedNoteId.value = noteId;
        }
      };

      dom.addEventListener("click", navigate);
      dom.addEventListener("keydown", (e) => {
        if ((e as KeyboardEvent).key === "Enter") navigate(e);
      });

      return { dom };
    };
  },
});
