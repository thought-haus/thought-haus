import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  placeholder,
  drawSelection,
  highlightActiveLine,
  highlightSpecialChars,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, historyKeymap, history } from "@codemirror/commands";
import {
  syntaxHighlighting,
  bracketMatching,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { noteLinkPlugin, noteLinkTheme } from "./note-links.ts";

export interface EditorConfig {
  parent: HTMLElement;
  content: string;
  onChange: (content: string) => void;
}

const notiEditorTheme = EditorView.theme({
  "&": {
    fontSize: "16px",
    fontFamily: '"Iosevka Aile", var(--font-sans)',
    color: "var(--color-text)",
    backgroundColor: "var(--color-bg)",
    height: "100%",
  },
  ".cm-content": {
    padding: "1.25rem 0 2rem",
    lineHeight: "1.75",
    caretColor: "var(--color-accent)",
    fontFamily: '"Iosevka Aile", var(--font-sans)',
    minHeight: "300px",
    maxWidth: "720px",
  },
  "&.cm-focused": {
    outline: "none",
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "var(--color-accent)",
    borderLeftWidth: "1.5px",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--editor-selection)",
  },
  ".cm-selectionBackground": {
    backgroundColor: "var(--editor-selection)",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--editor-active-line)",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: '"Iosevka Aile", var(--font-sans)',
  },
  ".cm-line": {
    padding: "0.125rem 4px",
  },
  ".cm-placeholder": {
    color: "var(--color-text-secondary)",
    fontStyle: "italic",
  },
  ".cm-gutters": {
    display: "none",
  },
});

const notiHighlightStyle = HighlightStyle.define([
  // Headings
  { tag: tags.heading1, fontSize: "1.625em", fontWeight: "600", letterSpacing: "-0.02em" },
  { tag: tags.heading2, fontSize: "1.375em", fontWeight: "600", letterSpacing: "-0.015em" },
  { tag: tags.heading3, fontSize: "1.125em", fontWeight: "600", letterSpacing: "-0.01em" },
  { tag: tags.heading4, fontSize: "1em", fontWeight: "600" },
  { tag: tags.heading5, fontSize: "0.9375em", fontWeight: "600", color: "var(--color-text-secondary)" },
  { tag: tags.heading6, fontSize: "0.875em", fontWeight: "600", color: "var(--color-text-secondary)" },

  // Inline formatting
  { tag: tags.strong, fontWeight: "600" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--color-text-secondary)" },

  // Code
  { tag: tags.monospace, fontFamily: "var(--font-mono)", fontSize: "0.875em", color: "var(--editor-code-text)" },

  // Links
  { tag: tags.link, color: "var(--color-accent)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--editor-syntax)" },

  // Quotes
  { tag: tags.quote, color: "var(--editor-blockquote-text)", fontStyle: "italic" },

  // Lists
  { tag: tags.list, color: "var(--color-accent)" },

  // Markdown meta/punctuation (##, **, `, etc.)
  { tag: tags.meta, color: "var(--editor-syntax)" },
  { tag: tags.processingInstruction, color: "var(--editor-syntax)" },

  // Horizontal rules
  { tag: tags.contentSeparator, color: "var(--editor-hr)" },
]);

/** Create a CodeMirror 6 editor instance with Markdown support. */
export function createEditor({ parent, content, onChange }: EditorConfig): EditorView {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onChange(update.state.doc.toString());
    }
  });

  const state = EditorState.create({
    doc: content,
    extensions: [
      // Core
      history(),
      EditorState.allowMultipleSelections.of(true),

      // Visual polish
      drawSelection(),
      highlightActiveLine(),
      highlightSpecialChars(),
      highlightSelectionMatches(),
      dropCursor(),
      rectangularSelection(),
      crosshairCursor(),

      // Bracket/pair handling
      bracketMatching(),
      closeBrackets(),

      // Markdown
      markdown({ base: markdownLanguage, codeLanguages: languages }),

      // Syntax highlighting
      syntaxHighlighting(notiHighlightStyle),

      // Keymaps
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
      ]),

      // Line wrapping
      EditorView.lineWrapping,

      // Placeholder
      placeholder("Start writing..."),

      // Theme
      notiEditorTheme,

      // Note links
      noteLinkPlugin,
      noteLinkTheme,

      // Update listener
      updateListener,
    ],
  });

  return new EditorView({ state, parent });
}
