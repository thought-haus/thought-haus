import { useComputed } from "@preact/signals";
import {
  filteredNotes,
  noteCount,
  tagCounts,
  activeTagFilter,
} from "../notes/note-store.ts";
import { getDateGroup } from "../lib/date.ts";
import type { Note } from "../notes/note.ts";
import styles from "./sidebar.module.css";

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function NoteItem({ note, isSelected, onSelect }: NoteItemProps) {
  return (
    <button
      class={`${styles.noteItem} ${isSelected ? styles.noteItemSelected : ""}`}
      onClick={() => onSelect(note.id)}
    >
      <div class={styles.noteTitle}>{note.title}</div>
      {note.tags.length > 0 && (
        <div class={styles.noteTags}>
          {note.tags.map((tag) => (
            <span key={tag} class={styles.tagPill}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

interface SidebarProps {
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
}

export function Sidebar({ selectedNoteId, onSelectNote }: SidebarProps) {
  const notes = filteredNotes.value;
  const count = noteCount.value;
  const tags = tagCounts.value;
  const activeTag = activeTagFilter.value;

  // Group notes by date
  const grouped = useComputed(() => {
    const groups: { label: string; notes: Note[] }[] = [];
    let currentLabel = "";
    for (const note of filteredNotes.value) {
      const label = getDateGroup(note.createdAt);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, notes: [] });
      }
      groups[groups.length - 1].notes.push(note);
    }
    return groups;
  });

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
        <button
          class={`${styles.sectionHeader} ${styles.allNotesBtn} ${!activeTag ? styles.allNotesBtnActive : ""}`}
          onClick={() => (activeTagFilter.value = null)}
        >
          All Notes ({count})
        </button>
      </div>

      {tags.size > 0 && (
        <div class={styles.section}>
          <div class={styles.sectionLabel}>Tags</div>
          <div class={styles.tagList}>
            {Array.from(tags.entries())
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([tag, tagCount]) => (
                <button
                  key={tag}
                  class={`${styles.tagFilter} ${activeTag === tag ? styles.tagFilterActive : ""}`}
                  onClick={() =>
                    (activeTagFilter.value =
                      activeTag === tag ? null : tag)
                  }
                >
                  {tag} ({tagCount})
                </button>
              ))}
          </div>
        </div>
      )}

      <div class={styles.noteList} aria-label="Note list">
        {notes.length === 0 ? (
          <div class={styles.emptyState}>No notes yet</div>
        ) : (
          grouped.value.map((group) => (
            <div key={group.label}>
              <div class={styles.dateGroup}>{group.label}</div>
              {group.notes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  isSelected={note.id === selectedNoteId}
                  onSelect={onSelectNote}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
