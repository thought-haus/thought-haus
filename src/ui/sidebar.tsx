import styles from "./sidebar.module.css";

export function Sidebar() {
  return (
    <aside class={styles.sidebar}>
      <div class={styles.searchBar}>
        <input
          class={styles.searchInput}
          type="text"
          placeholder="Search notes..."
          aria-label="Search notes"
        />
      </div>
      <div class={styles.section}>
        <div class={styles.sectionHeader}>All Notes</div>
      </div>
      <div class={styles.section}>
        <div class={styles.sectionHeader}>Tags</div>
      </div>
      <div class={styles.noteList} aria-label="Note list">
        <div class={styles.emptyState}>No notes yet</div>
      </div>
    </aside>
  );
}
