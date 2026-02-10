import { useEffect, useRef, useCallback } from "preact/hooks";
import { selectedNoteId } from "../lib/app-state.ts";
import { getNote, upsertNote } from "../notes/note-store.ts";
import { readNoteContent, writeFile } from "../fs/file-ops.ts";
import { parseFrontMatter, serializeFrontMatter } from "../notes/frontmatter.ts";
import { createEditor } from "../editor/editor.ts";
import { saveStatus, wordCount, countWords } from "../editor/editor-state.ts";
import { debounce } from "../lib/debounce.ts";
import type { EditorView } from "@codemirror/view";
import styles from "./editor-view.module.css";

export function EditorView_() {
  const editorRef = useRef<HTMLDivElement>(null);
  const cmRef = useRef<EditorView | null>(null);
  const bodyRef = useRef("");
  const noteIdRef = useRef<string | null>(null);

  const saveNote = useCallback(async () => {
    const noteId = noteIdRef.current;
    if (!noteId) return;
    const note = getNote(noteId);
    if (!note) return;

    saveStatus.value = "saving";
    try {
      const content = serializeFrontMatter(
        {
          title: note.title,
          date: note.createdAt.toISOString().replace("Z", ""),
          tags: note.tags,
        },
        bodyRef.current,
      );
      await writeFile(note.fileHandle, content);
      const file = await note.fileHandle.getFile();
      upsertNote({ ...note, lastModified: file.lastModified, size: file.size });
      saveStatus.value = "saved";
    } catch {
      saveStatus.value = "unsaved";
    }
  }, []);

  const debouncedSave = useRef(debounce(() => saveNote(), 1500));

  // Load note content when selection changes
  useEffect(() => {
    const noteId = selectedNoteId.value;
    noteIdRef.current = noteId;

    if (!noteId) {
      saveStatus.value = "idle";
      wordCount.value = 0;
      if (cmRef.current) {
        cmRef.current.destroy();
        cmRef.current = null;
      }
      return;
    }

    const note = getNote(noteId);
    if (!note) return;

    (async () => {
      const rawContent = await readNoteContent(note.fileHandle);
      const { body } = parseFrontMatter(rawContent);
      bodyRef.current = body;
      wordCount.value = countWords(body);
      saveStatus.value = "saved";

      // Destroy old editor
      if (cmRef.current) {
        cmRef.current.destroy();
        cmRef.current = null;
      }

      if (!editorRef.current) return;

      cmRef.current = createEditor({
        parent: editorRef.current,
        content: body,
        onChange: (newContent) => {
          bodyRef.current = newContent;
          wordCount.value = countWords(newContent);
          saveStatus.value = "unsaved";
          debouncedSave.current();
        },
      });
    })();

    return () => {
      debouncedSave.current.cancel();
    };
  }, [selectedNoteId.value]);

  // Save on blur
  useEffect(() => {
    const handleBlur = () => {
      if (saveStatus.value === "unsaved") {
        debouncedSave.current.cancel();
        saveNote();
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [saveNote]);

  // Best-effort save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveStatus.value === "unsaved") {
        debouncedSave.current.cancel();
        saveNote();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveNote]);

  const noteId = selectedNoteId.value;
  const note = noteId ? getNote(noteId) : null;

  if (!note) {
    return (
      <main class={styles.editor}>
        <div class={styles.placeholder}>
          <p>Select a note or create a new one</p>
        </div>
      </main>
    );
  }

  return (
    <main class={styles.editor}>
      <div class={styles.header}>
        <h1 class={styles.title}>{note.title}</h1>
        <div class={styles.metadata}>
          {note.tags.length > 0 && (
            <div class={styles.tags}>
              {note.tags.map((tag) => (
                <span key={tag} class={styles.tagPill}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <span class={styles.date}>
            {note.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
      <div class={styles.editorBody} ref={editorRef} />
      <div class={styles.statusBar}>
        <span>{wordCount.value} words</span>
        <span class={styles.saveIndicator}>
          {saveStatus.value === "saved" && "Saved"}
          {saveStatus.value === "saving" && "Saving..."}
          {saveStatus.value === "unsaved" && "Unsaved"}
        </span>
      </div>
    </main>
  );
}

// Re-export with proper name
export { EditorView_ as EditorView };
