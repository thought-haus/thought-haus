import { useEffect, useState, useRef, useCallback } from "preact/hooks";
import {
  selectedNoteId,
  sidebarCollapsed,
  sidebarWidth,
  setSidebarWidth,
  agentPanelWidth,
  setAgentPanelWidth,
} from "../lib/app-state.ts";
import { agentPanelOpen } from "../agent/agent-state.ts";
import { getNote } from "../notes/note-store.ts";
import { createNote, deleteNote } from "../notes/note-actions.ts";
import { toggleFavorite } from "../favorites/favorite-store.ts";
import { Sidebar } from "./sidebar.tsx";
import { EditorView } from "./editor-view.tsx";
import { AgentPanel } from "./agent-panel.tsx";
import styles from "./layout.module.css";

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;
const MIN_AGENT_PANEL_WIDTH = 280;
const MAX_AGENT_PANEL_WIDTH = 900;

type ResizeTarget = "sidebar" | "agentPanel" | null;

export function Layout() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const resizeTargetRef = useRef<ResizeTarget>(null);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleSidebarResizeStart = useCallback((e: MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth.value;
    resizeTargetRef.current = "sidebar";
    setIsResizing(true);
  }, []);

  const handleAgentPanelResizeStart = useCallback((e: MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    startWidthRef.current = agentPanelWidth.value;
    resizeTargetRef.current = "agentPanel";
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizeTargetRef.current === "sidebar") {
        const delta = e.clientX - startXRef.current;
        const newWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidthRef.current + delta));
        sidebarWidth.value = newWidth;
      } else if (resizeTargetRef.current === "agentPanel") {
        // Dragging left increases width for the right panel
        const delta = startXRef.current - e.clientX;
        const newWidth = Math.min(MAX_AGENT_PANEL_WIDTH, Math.max(MIN_AGENT_PANEL_WIDTH, startWidthRef.current + delta));
        agentPanelWidth.value = newWidth;
      }
    };

    const handleMouseUp = () => {
      if (resizeTargetRef.current === "sidebar") {
        setSidebarWidth(sidebarWidth.value);
      } else if (resizeTargetRef.current === "agentPanel") {
        setAgentPanelWidth(agentPanelWidth.value);
      }
      resizeTargetRef.current = null;
      setIsResizing(false);
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
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const id = selectedNoteId.value;
        if (id) toggleFavorite(id);
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
            class={`${styles.resizeHandle} ${isResizing && resizeTargetRef.current === "sidebar" ? styles.resizeHandleActive : ""}`}
            onMouseDown={handleSidebarResizeStart}
          />
        </>
      )}
      <div class={styles.editorPane}>
        <EditorView onDelete={handleDeleteNote} />
      </div>
      {agentPanelOpen.value && (
        <>
          <div
            class={`${styles.resizeHandle} ${isResizing && resizeTargetRef.current === "agentPanel" ? styles.resizeHandleActive : ""}`}
            onMouseDown={handleAgentPanelResizeStart}
          />
          <div style={{ width: `${agentPanelWidth.value}px`, minWidth: `${agentPanelWidth.value}px` }}>
            <AgentPanel />
          </div>
        </>
      )}
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
