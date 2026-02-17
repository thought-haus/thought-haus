import { useComputed } from "@preact/signals";
import { useRef, useState } from "preact/hooks";
import {
  filteredNotes,
  noteCount,
  activeTagFilter,
  getNote,
} from "../notes/note-store.ts";
import type { Note } from "@thought-haus/core";
import { getDateGroup, getModifiedDateGroup } from "@thought-haus/core";
import {
  executeSearch,
  clearSearch,
  searchQuery,
  searchResults,
  isSearchActive,
  isIndexReady,
} from "../search/search-engine.ts";
import {
  sortMode,
  sortDirection,
  setSort,
  SORT_DEFAULTS,
} from "../lib/app-state.ts";
import {
  Clock,
  ArrowDownAZ,
  PenLine,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
} from "lucide-preact";
import type { SortMode } from "../lib/app-state.ts";
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

const SORT_CYCLE: SortMode[] = ["created", "title", "modified"];
const SORT_LABELS: Record<SortMode, string> = {
  created: "Date created",
  title: "Title",
  modified: "Last modified",
};
const DIR_LABELS: Record<string, string> = {
  asc: "oldest first",
  desc: "newest first",
  "title-asc": "A \u2192 Z",
  "title-desc": "Z \u2192 A",
};

function getSortDirLabel(mode: SortMode, dir: string): string {
  if (mode === "title") return DIR_LABELS[`title-${dir}`];
  return DIR_LABELS[dir];
}

function SortButton() {
  const mode = sortMode.value;
  const dir = sortDirection.value;
  const next = SORT_CYCLE[(SORT_CYCLE.indexOf(mode) + 1) % SORT_CYCLE.length];
  const isNonDefault = mode !== "created" || dir !== "desc";

  const handleClick = () => {
    setSort(next, SORT_DEFAULTS[next]);
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setSort(mode, dir === "asc" ? "desc" : "asc");
  };

  return (
    <button
      class={`${styles.sortBtn} ${isNonDefault ? styles.sortBtnActive : ""}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      title={`Sort: ${SORT_LABELS[mode]} (${getSortDirLabel(mode, dir)}) \u00b7 Right-click to reverse`}
      aria-label={`Sort by ${SORT_LABELS[mode]}`}
    >
      {mode === "created" && <Clock size={14} />}
      {mode === "title" && <ArrowDownAZ size={14} />}
      {mode === "modified" && <PenLine size={14} />}
      {dir === "asc" ? (
        <ChevronUp size={8} style="position:absolute;bottom:1px;right:1px;" />
      ) : (
        <ChevronDown size={8} style="position:absolute;bottom:1px;right:1px;" />
      )}
    </button>
  );
}

interface NotesListProps {
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
}

export function NotesList({ selectedNoteId, onSelectNote, onNewNote }: NotesListProps) {
  const notes = filteredNotes.value;
  const count = noteCount.value;
  const activeTag = activeTagFilter.value;
  const query = searchQuery.value;
  const results = searchResults.value;
  const searching = isSearchActive.value;
  const indexReady = isIndexReady.value;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Group notes by date (or flat for title sort)
  const grouped = useComputed(() => {
    const mode = sortMode.value;
    if (mode === "title") {
      return [{ label: "", notes: filteredNotes.value }];
    }

    const groups: { label: string; notes: Note[] }[] = [];
    let currentLabel = "";
    for (const note of filteredNotes.value) {
      const label = mode === "modified"
        ? getModifiedDateGroup(new Date(note.lastModified))
        : getDateGroup(note.createdAt);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, notes: [] });
      }
      groups[groups.length - 1].notes.push(note);
    }
    return groups;
  });


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
          placeholder={indexReady ? "Search... (⌘K)" : "Indexing notes…"}
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
            <X size={14} />
          </button>
        )}
      </div>
      {!indexReady && (
        <div class={styles.indexingHint}>Indexing…</div>
      )}

      {searching ? (
        <div class={styles.noteList} aria-label="Search results">
          <div class={styles.listHeader}>
            <span class={styles.listLabel}>
              {results.length} result{results.length !== 1 ? "s" : ""}
            </span>
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
        <div class={styles.noteList} aria-label="Note list">
          <div class={styles.listHeader}>
            {activeTag ? (
              <button
                class={styles.listLabelBtn}
                onClick={() => (activeTagFilter.value = null)}
                title="Click to show all notes"
              >
                <span class={styles.listLabel}>{activeTag}</span>
                <span class={styles.listCount}>({notes.length})</span>
                <X size={10} class={styles.listClearIcon} />
              </button>
            ) : (
              <span class={styles.listLabel}>
                All Notes <span class={styles.listCount}>({count})</span>
              </span>
            )}
            <div class={styles.listActions}>
              <SortButton />
              <button
                class={styles.newNoteBtn}
                onClick={onNewNote}
                title="New note (Cmd/Ctrl+N)"
                aria-label="New note"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          {notes.length === 0 ? (
            <div class={styles.emptyState}>No notes yet</div>
          ) : (
            grouped.value.map((group) => (
              <div key={group.label || "_flat"}>
                {group.label && <div class={styles.dateGroup}>{group.label}</div>}
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
      )}
    </aside>
  );
}
