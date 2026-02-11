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
import { themeMode, setTheme } from "../lib/app-state.ts";
import type { ThemeMode } from "../lib/app-state.ts";
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

const THEME_CYCLE: ThemeMode[] = ["light", "dark", "system"];
const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

function ThemeToggle() {
  const mode = themeMode.value;
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(mode) + 1) % THEME_CYCLE.length];

  return (
    <button
      class={styles.themeToggle}
      onClick={() => setTheme(next)}
      title={`Theme: ${THEME_LABELS[mode]} (click for ${THEME_LABELS[next]})`}
      aria-label={`Switch theme to ${THEME_LABELS[next]}`}
    >
      {mode === "light" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
      {mode === "dark" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      {mode === "system" && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )}
      <span>{THEME_LABELS[mode]}</span>
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

      <div class={styles.sidebarFooter}>
        <ThemeToggle />
      </div>
    </aside>
  );
}
