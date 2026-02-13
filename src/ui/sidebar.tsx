import { useComputed } from "@preact/signals";
import { useRef, useEffect, useState } from "preact/hooks";
import {
  filteredNotes,
  noteCount,
  tagCounts,
  activeTagFilter,
  getNote,
} from "../notes/note-store.ts";
import { getDateGroup, getModifiedDateGroup } from "../lib/date.ts";
import {
  executeSearch,
  clearSearch,
  searchQuery,
  searchResults,
  isSearchActive,
} from "../search/search-engine.ts";
import {
  themeMode,
  setTheme,
  sortMode,
  sortDirection,
  setSort,
  SORT_DEFAULTS,
} from "../lib/app-state.ts";
import { agentPanelOpen } from "../agent/agent-state.ts";
import {
  favoriteNotes,
  favoritesCollapsed,
  setFavoritesCollapsed,
  moveFavorite,
  removeFavorite,
} from "../favorites/favorite-store.ts";
import {
  Sun,
  Moon,
  Monitor,
  Clock,
  ArrowDownAZ,
  PenLine,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Bot,
  Star,
} from "lucide-preact";
import type { ThemeMode, SortMode } from "../lib/app-state.ts";
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

// Module-level DnD state (not reactive — avoids re-renders during drag)
let dragFromIndex = -1;

interface FavoriteItemProps {
  note: Note;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

function FavoriteItem({ note, index, isSelected, onSelect, onRemove }: FavoriteItemProps) {
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null);
  const totalCount = favoriteNotes.value.length;

  return (
    <button
      class={`${styles.favoriteItem} ${isSelected ? styles.favoriteItemSelected : ""}`}
      draggable
      role="listitem"
      aria-label={`${note.title}, favorited`}
      onDragStart={() => { dragFromIndex = index; }}
      onDragOver={(e) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDropPosition(e.clientY < rect.top + rect.height / 2 ? "above" : "below");
      }}
      onDragLeave={() => setDropPosition(null)}
      onDrop={(e) => {
        e.preventDefault();
        setDropPosition(null);
        const toIndex = dropPosition === "above" ? index : index + 1;
        if (dragFromIndex !== -1 && dragFromIndex !== toIndex) {
          moveFavorite(dragFromIndex, toIndex > dragFromIndex ? toIndex - 1 : toIndex);
        }
        dragFromIndex = -1;
      }}
      onDragEnd={() => { dragFromIndex = -1; setDropPosition(null); }}
      onClick={() => onSelect(note.id)}
      onKeyDown={(e) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          onRemove(note.id);
        }
        if (e.ctrlKey && e.key === "ArrowUp" && index > 0) {
          e.preventDefault();
          moveFavorite(index, index - 1);
        }
        if (e.ctrlKey && e.key === "ArrowDown" && index < totalCount - 1) {
          e.preventDefault();
          moveFavorite(index, index + 1);
        }
      }}
    >
      {dropPosition === "above" && <div class={styles.dropIndicator} />}
      <Star size={12} fill="currentColor" class={styles.favoriteStar} />
      <div class={styles.favoriteContent}>
        <div class={styles.noteTitle}>{note.title}</div>
        {note.tags.length > 0 && (
          <div class={styles.noteTags}>
            {note.tags.map((tag) => (
              <span key={tag} class={styles.tagPill}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <button
        class={styles.favoriteRemove}
        onClick={(e) => { e.stopPropagation(); onRemove(note.id); }}
        aria-label={`Remove ${note.title} from favorites`}
      >
        <X size={12} />
      </button>
      {dropPosition === "below" && <div class={styles.dropIndicator} />}
    </button>
  );
}

interface FavoritesSectionProps {
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
}

function FavoritesSection({ selectedNoteId, onSelectNote }: FavoritesSectionProps) {
  const favorites = favoriteNotes.value;
  const collapsed = favoritesCollapsed.value;

  if (favorites.length === 0) return null;

  return (
    <section class={styles.collapsibleSection} aria-label="Favorites">
      <button
        class={styles.collapsibleHeader}
        onClick={() => setFavoritesCollapsed(!collapsed)}
        aria-expanded={!collapsed}
        aria-controls="favorites-list"
      >
        {collapsed
          ? <ChevronRight size={10} />
          : <ChevronDown size={10} />}
        <span>Favorites ({favorites.length})</span>
      </button>
      {!collapsed && (
        <div id="favorites-list" role="list" class={styles.favoritesList}>
          {favorites.map((note, i) => (
            <FavoriteItem
              key={note.id}
              note={note}
              index={i}
              isSelected={note.id === selectedNoteId}
              onSelect={onSelectNote}
              onRemove={removeFavorite}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const TAGS_COLLAPSED_KEY = "noti-tags-collapsed";

interface TagsSectionProps {
  tags: Map<string, number>;
  activeTag: string | null;
}

function TagsSection({ tags, activeTag }: TagsSectionProps) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(TAGS_COLLAPSED_KEY) === "true";
    } catch { return false; }
  });

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem(TAGS_COLLAPSED_KEY, String(next)); } catch { /* */ }
  };

  return (
    <section class={styles.collapsibleSection} aria-label="Tags">
      <button
        class={styles.collapsibleHeader}
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls="tags-list"
      >
        {collapsed
          ? <ChevronRight size={10} />
          : <ChevronDown size={10} />}
        <span>Tags ({tags.size})</span>
      </button>
      {!collapsed && (
        <div id="tags-list" class={styles.tagList}>
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
      )}
    </section>
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
      {mode === "light" && <Sun size={14} />}
      {mode === "dark" && <Moon size={14} />}
      {mode === "system" && <Monitor size={14} />}
      <span>{THEME_LABELS[mode]}</span>
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
  "title-asc": "A → Z",
  "title-desc": "Z → A",
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
      title={`Sort: ${SORT_LABELS[mode]} (${getSortDirLabel(mode, dir)}) · Right-click to reverse`}
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
            <X size={14} />
          </button>
        )}
      </div>

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
        <>
          {/* Zone 1: Navigation & filtering */}
          <div class={styles.navZone}>
            {tags.size > 0 && (
              <TagsSection tags={tags} activeTag={activeTag} />
            )}
            <FavoritesSection selectedNoteId={selectedNoteId} onSelectNote={onSelectNote} />
          </div>

          {/* Zone 2: Note list */}
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
        </>
      )}

      <div class={styles.sidebarFooter}>
        <ThemeToggle />
        <button
          class={styles.aiToggle}
          onClick={() => (agentPanelOpen.value = !agentPanelOpen.value)}
          title="AI Assistant (Cmd+Shift+A)"
          aria-label="Toggle AI assistant"
        >
          <Bot size={14} />
          <span>AI</span>
        </button>
      </div>
    </aside>
  );
}
