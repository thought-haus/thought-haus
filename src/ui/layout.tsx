import { useEffect, useState, useRef, useCallback } from "preact/hooks";
import {
  selectedNoteId,
  sidebarCollapsed,
  sidebarWidth,
  setSidebarWidth,
} from "../lib/app-state.ts";
import { agentPanelOpen } from "../agent/agent-state.ts";
import { getNote } from "../notes/note-store.ts";
import { createNote, deleteNote } from "../notes/note-actions.ts";
import { Sidebar } from "./sidebar.tsx";
import { EditorView } from "./editor-view.tsx";
import { AgentPanel } from "./agent-panel.tsx";
import styles from "./layout.module.css";

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;

export function Layout() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleResizeStart = useCallback((e: MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth.value;
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidthRef.current + delta));
      sidebarWidth.value = newWidth;
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setSidebarWidth(sidebarWidth.value);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        agentPanelOpen.value = !agentPanelOpen.value;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const noteId = selectedNoteId.value;
  const note = noteId ? getNote(noteId) : null;

  return (
    <div class={`${styles.layout} ${isResizing ? styles.layoutResizing : ""}`}>
      {!sidebarCollapsed.value && (
        <>
          <div style={{ width: `${sidebarWidth.value}px`, minWidth: `${sidebarWidth.value}px` }}>
            <Sidebar
              selectedNoteId={selectedNoteId.value}
              onSelectNote={(id) => (selectedNoteId.value = id)}
              onNewNote={handleNewNote}
            />
          </div>
          <div
            class={`${styles.resizeHandle} ${isResizing ? styles.resizeHandleActive : ""}`}
            onMouseDown={handleResizeStart}
          />
        </>
      )}
      <div class={styles.editorPane}>
        <EditorView onDelete={handleDeleteNote} />
      </div>
      {agentPanelOpen.value && <AgentPanel />}
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
