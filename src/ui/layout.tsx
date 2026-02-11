import { useEffect, useState } from "preact/hooks";
import { selectedNoteId, sidebarCollapsed } from "../lib/app-state.ts";
import { getNote } from "../notes/note-store.ts";
import { createNote, deleteNote } from "../notes/note-actions.ts";
import { Sidebar } from "./sidebar.tsx";
import { EditorView } from "./editor-view.tsx";
import styles from "./layout.module.css";

export function Layout() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleNewNote = () => {
    createNote();
  };

  const handleDeleteNote = () => {
    const noteId = selectedNoteId.value;
    if (!noteId) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const noteId = selectedNoteId.value;
    if (noteId) {
      await deleteNote(noteId);
    }
    setShowDeleteConfirm(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        createNote();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        sidebarCollapsed.value = !sidebarCollapsed.value;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const noteId = selectedNoteId.value;
  const note = noteId ? getNote(noteId) : null;

  return (
    <div class={styles.layout}>
      {!sidebarCollapsed.value && (
        <Sidebar
          selectedNoteId={selectedNoteId.value}
          onSelectNote={(id) => (selectedNoteId.value = id)}
          onNewNote={handleNewNote}
        />
      )}
      <div class={styles.editorPane}>
        <EditorView onDelete={handleDeleteNote} />
      </div>
      {showDeleteConfirm && (
        <div class={styles.overlay} role="dialog" aria-label="Confirm deletion">
          <div class={styles.dialog}>
            <p>Delete "{note?.title}"?</p>
            <p class={styles.dialogHint}>This action cannot be undone.</p>
            <div class={styles.dialogActions}>
              <button
                class={styles.cancelBtn}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button class={styles.confirmDeleteBtn} onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
