import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { NoteLink } from "./extensions/note-link.ts";
import "./tiptap-theme.css";

export interface EditorConfig {
  parent: HTMLElement;
  content: string;
  onChange: (text: string) => void;
}

/** Create a TipTap editor instance with Markdown support. */
export function createEditor({ parent, content, onChange }: EditorConfig): Editor {
  return new Editor({
    element: parent,
    content,
    contentType: "markdown",
    extensions: [
      StarterKit,
      Markdown,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Typography,
      NoteLink,
    ],
    onUpdate({ editor }) {
      onChange(editor.getText());
    },
  });
}
