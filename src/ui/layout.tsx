import styles from "./layout.module.css";
import { Sidebar } from "./sidebar.tsx";
import { EditorView } from "./editor-view.tsx";

export function Layout() {
  return (
    <div class={styles.layout}>
      <Sidebar />
      <EditorView />
    </div>
  );
}
