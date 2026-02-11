import { useComputed } from "@preact/signals";
import { useRef, useEffect, useState } from "preact/hooks";
import {
  filteredNotes,
  noteCount,
  tagCounts,
  activeTagFilter,
  getNote,
} from "../notes/note-store.ts";
import { getDateGroup } from "../lib/date.ts";
import {
  executeSearch,
  clearSearch,
  searchQuery,
  searchResults,
  isSearchActive,
} from "../search/search-engine.ts";
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
  onNewNote: () => void;
}

export function Sidebar({ selectedNoteId, onSelectNote, onNewNote }: SidebarProps) {
  const notes = filteredNotes.value;
  const count = noteCount.value;
  const tags = tagCounts.value;
  const activeTag = activeTagFilter.value;
  const query = searchQuery.value;
  const results = searchResults.value;
  const searching = isSearchActive.value;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    executeSearch(value);
    setHighlightedIndex(-1);
  };

  const handleSearchClear = () => {
    clearSearch();
    setHighlightedIndex(-1);
    searchInputRef.current?.focus();
  };

  // Resolve search results to Note objects
  const searchNotes = searching
    ? results
        .map((r) => getNote(r.id))
        .filter((n): n is Note => n !== undefined)
    : [];

  const moveHighlight = (delta: number) => {
    if (searchNotes.length === 0) return;
    setHighlightedIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return searchNotes.length - 1;
      if (next >= searchNotes.length) return 0;
      return next;
    });
  };

  const selectHighlighted = () => {
    if (highlightedIndex >= 0 && highlightedIndex < searchNotes.length) {
      onSelectNote(searchNotes[highlightedIndex].id);
      clearSearch();
      setHighlightedIndex(-1);
      searchInputRef.current?.blur();
    }
  };

  return (
    <aside class={styles.sidebar}>
      <div class={styles.searchBar}>
        <input
          ref={searchInputRef}
          class={styles.searchInput}
          type="text"
          value={query}
          placeholder="Search notes... (Cmd+K)"
          aria-label="Search notes"
          onInput={handleSearchInput}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              clearSearch();
              setHighlightedIndex(-1);
              (e.target as HTMLInputElement).blur();
            } else if (
              searching &&
              (e.key === "ArrowDown" ||
                (e.ctrlKey && e.key === "n") ||
                (e.ctrlKey && e.key === "j"))
            ) {
              e.preventDefault();
              moveHighlight(1);
            } else if (
              searching &&
              (e.key === "ArrowUp" ||
                (e.ctrlKey && e.key === "p") ||
                (e.ctrlKey && e.key === "k"))
            ) {
              e.preventDefault();
              moveHighlight(-1);
            } else if (searching && e.key === "Enter") {
              e.preventDefault();
              selectHighlighted();
            }
          }}
        />
        {searching && (
          <button
            class={styles.searchClear}
            onClick={handleSearchClear}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {searching ? (
        <div class={styles.noteList} aria-label="Search results">
          <div class={styles.section}>
            <div class={styles.sectionLabel}>
              {results.length} result{results.length !== 1 ? "s" : ""}
            </div>
          </div>
          {searchNotes.length === 0 ? (
            <div class={styles.emptyState}>No matching notes</div>
          ) : (
            searchNotes.map((note, i) => (
              <NoteItem
                key={note.id}
                note={note}
                isSelected={note.id === selectedNoteId || i === highlightedIndex}
                onSelect={onSelectNote}
              />
            ))
          )}
        </div>
      ) : (
        <>
          <div class={styles.section}>
            <div class={styles.sectionRow}>
              <button
                class={`${styles.sectionHeader} ${styles.allNotesBtn} ${!activeTag ? styles.allNotesBtnActive : ""}`}
                onClick={() => (activeTagFilter.value = null)}
              >
                All Notes ({count})
              </button>
              <button
                class={styles.newNoteBtn}
                onClick={onNewNote}
                title="New note (Cmd/Ctrl+N)"
                aria-label="New note"
              >
                +
              </button>
            </div>
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
        </>
      )}
    </aside>
  );
}
