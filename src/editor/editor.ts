import { EditorState } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, historyKeymap, history } from "@codemirror/commands";
import { noteLinkPlugin, noteLinkTheme } from "./note-links.ts";

export interface EditorConfig {
  parent: HTMLElement;
  content: string;
  onChange: (content: string) => void;
}

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
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      updateListener,
      noteLinkPlugin,
      noteLinkTheme,
      placeholder("Start writing..."),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          fontSize: "15px",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
        },
        ".cm-content": {
          padding: "1rem 0",
          minHeight: "200px",
        },
        ".cm-focused": {
          outline: "none",
        },
        ".cm-scroller": {
          overflow: "auto",
        },
      }),
    ],
  });

  return new EditorView({ state, parent });
}
