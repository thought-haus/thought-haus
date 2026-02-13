import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { NoteLink } from "./extensions/note-link.ts";
import { LinkEdit } from "./extensions/link-edit.ts";
import { AttachmentImage } from "./extensions/attachment-image.ts";
import { AttachmentCard } from "./extensions/attachment-card.ts";
import { FileDrop } from "./extensions/file-drop.ts";
import "./tiptap-theme.css";

export interface EditorConfig {
  parent: HTMLElement;
  content: string;
  onChange: (text: string) => void;
  onFileDrop?: (files: File[], pos: number) => void;
}

/** Create a TipTap editor instance with Markdown support. */
export function createEditor({ parent, content, onChange, onFileDrop }: EditorConfig): Editor {
  return new Editor({
    element: parent,
    content,
    contentType: "markdown",
    extensions: [
      StarterKit.configure({ link: false }),
      Markdown,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
        autolink: true,
        shouldAutoLink: (url: string) => /^https?:\/\//i.test(url),
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      AttachmentImage,
      AttachmentCard,
      FileDrop.configure({ onFileDrop: onFileDrop ?? (() => {}) }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Typography,
      NoteLink,
      LinkEdit,
    ],
    onUpdate({ editor }) {
      onChange(editor.getText());
    },
  });
}
