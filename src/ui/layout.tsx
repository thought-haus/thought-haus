import { selectedNoteId } from "../lib/app-state.ts";
import { Sidebar } from "./sidebar.tsx";
import { EditorView } from "./editor-view.tsx";
import styles from "./layout.module.css";

export function Layout() {
  return (
    <div class={styles.layout}>
      <Sidebar
        selectedNoteId={selectedNoteId.value}
        onSelectNote={(id) => (selectedNoteId.value = id)}
      />
      <EditorView />
    </div>
  );
}
