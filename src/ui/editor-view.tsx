import styles from "./editor-view.module.css";

export function EditorView() {
  return (
    <main class={styles.editor}>
      <div class={styles.placeholder}>
        <p>Select a note or create a new one</p>
      </div>
    </main>
  );
}
