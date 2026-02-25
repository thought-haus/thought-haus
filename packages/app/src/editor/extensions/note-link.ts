import { Node, type JSONContent } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type {
  MarkdownParseHelpers,
  MarkdownRendererHelpers,
  MarkdownToken,
  RenderContext,
} from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";
import { resolveNoteLink, NOTE_LINK_RE } from "../note-links.ts";
import { selectedNoteId } from "../../lib/app-state.ts";
import { noteLinkSuggestion } from "./note-link-suggest.ts";
import "../note-link-suggest.css";

const selectionLinkKey = new PluginKey("note-link-wrap-selection");

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

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...noteLinkSuggestion,
      }),
      // When text is selected and the user presses [, wrap the selection in [[...
      // to trigger the note-link suggestion with the selected text as the query.
      new Plugin({
        key: selectionLinkKey,
        props: {
          handleDOMEvents: {
            beforeinput(view, event) {
              const inputEvent = event as InputEvent;
              if (
                inputEvent.inputType === "insertText" &&
                inputEvent.data === "["
              ) {
                const { selection } = view.state;
                if (!selection.empty) {
                  const selectedText = view.state.doc
                    .textBetween(selection.from, selection.to, " ")
                    .trim();
                  if (selectedText) {
                    inputEvent.preventDefault();
                    const textToInsert = `[[${selectedText}`;
                    const tr = view.state.tr.replaceWith(
                      selection.from,
                      selection.to,
                      view.state.schema.text(textToInsert),
                    );
                    // Collapse to a cursor so the Suggestion plugin sees
                    // selection.empty === true and activates trigger detection.
                    // Without this, replaceWith maps the original range through
                    // the step, leaving a non-empty selection that suppresses
                    // the popup.
                    tr.setSelection(
                      TextSelection.create(
                        tr.doc,
                        selection.from + textToInsert.length,
                      ),
                    );
                    view.dispatch(tr);
                    return true;
                  }
                }
              }
              return false;
            },
          },
        },
      }),
    ];
  },
});
