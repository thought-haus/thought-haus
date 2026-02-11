import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { type Range } from "@codemirror/state";
import { getNote } from "../notes/note-store.ts";
import { selectedNoteId } from "../lib/app-state.ts";

/** Regex matching [[YYYYMMDDTHHMMSS]] note links. */
export const NOTE_LINK_RE = /\[\[(\d{8}T\d{6})\]\]/g;

/** Parse all note link references from a string. */
export function parseNoteLinks(
  text: string,
): { id: string; start: number; end: number }[] {
  const links: { id: string; start: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(NOTE_LINK_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    links.push({
      id: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return links;
}

/** Resolve a note link ID to a display label. */
export function resolveNoteLink(id: string): { title: string; exists: boolean } {
  const note = getNote(id);
  if (note) {
    return { title: note.title, exists: true };
  }
  return { title: id, exists: false };
}

class NoteLinkWidget extends WidgetType {
  noteId: string;
  title: string;
  exists: boolean;

  constructor(noteId: string, title: string, exists: boolean) {
    super();
    this.noteId = noteId;
    this.title = title;
    this.exists = exists;
  }

  toDOM(): HTMLElement {
    const span = document.createElement("span");
    span.textContent = this.exists ? this.title : `${this.noteId} (not found)`;
    span.className = this.exists ? "cm-note-link" : "cm-note-link-dead";
    span.dataset.noteId = this.noteId;
    span.setAttribute("role", "link");
    span.setAttribute("tabindex", "0");
    span.title = this.exists
      ? `Go to: ${this.title}`
      : `Broken link: ${this.noteId}`;
    return span;
  }

  eq(other: NoteLinkWidget): boolean {
    return (
      this.noteId === other.noteId &&
      this.title === other.title &&
      this.exists === other.exists
    );
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const decorations: Range<Decoration>[] = [];

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to);
    const links = parseNoteLinks(text);

    for (const link of links) {
      const absFrom = from + link.start;
      const absTo = from + link.end;
      const { title, exists } = resolveNoteLink(link.id);

      decorations.push(
        Decoration.replace({
          widget: new NoteLinkWidget(link.id, title, exists),
        }).range(absFrom, absTo),
      );
    }
  }

  return Decoration.set(decorations, true);
}

/** CodeMirror plugin that renders [[ID]] note links as clickable widgets. */
export const noteLinkPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    eventHandlers: {
      click(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (
          target.classList.contains("cm-note-link") &&
          target.dataset.noteId
        ) {
          event.preventDefault();
          selectedNoteId.value = target.dataset.noteId;
          return true;
        }
        return false;
      },
      keydown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        if (
          event.key === "Enter" &&
          target.classList.contains("cm-note-link") &&
          target.dataset.noteId
        ) {
          event.preventDefault();
          selectedNoteId.value = target.dataset.noteId;
          return true;
        }
        return false;
      },
    },
  },
);

/** Theme for note link decorations. */
export const noteLinkTheme = EditorView.baseTheme({
  ".cm-note-link": {
    color: "var(--color-accent)",
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationStyle: "dotted",
    textUnderlineOffset: "2px",
    textDecorationColor: "rgba(184, 98, 27, 0.4)",
    borderRadius: "2px",
    padding: "0 2px",
    transition: "text-decoration-color 0.15s ease, background 0.15s ease",
  },
  ".cm-note-link:hover": {
    textDecorationStyle: "solid",
    textDecorationColor: "var(--color-accent)",
    backgroundColor: "var(--color-accent-subtle)",
  },
  ".cm-note-link-dead": {
    color: "var(--color-danger)",
    cursor: "default",
    textDecoration: "line-through",
    opacity: "0.7",
    padding: "0 2px",
  },
});
