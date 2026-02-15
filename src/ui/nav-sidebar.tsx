import { useState } from "preact/hooks";
import {
  noteCount,
  tagCounts,
  activeTagFilter,
} from "../notes/note-store.ts";
import {
  themeMode,
  setTheme,
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
  FileText,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  ChevronDown,
  Star,
  X,
  Bot,
  Hash,
  FolderSync,
} from "lucide-preact";
import type { ThemeMode } from "../lib/app-state.ts";
import type { Note } from "../notes/note.ts";
import styles from "./nav-sidebar.module.css";

// Module-level DnD state (not reactive — avoids re-renders during drag)
let dragFromIndex = -1;

const TAGS_COLLAPSED_KEY = "th-tags-collapsed";

const THEME_CYCLE: ThemeMode[] = ["light", "dark", "system"];
const THEME_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

interface NavSidebarProps {
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onChangeStorage?: () => void;
}

export function NavSidebar({ selectedNoteId, onSelectNote, onChangeStorage }: NavSidebarProps) {
  const count = noteCount.value;
  const tags = tagCounts.value;
  const activeTag = activeTagFilter.value;
  const favorites = favoriteNotes.value;
  const favCollapsed = favoritesCollapsed.value;

  const [tagsCollapsed, setTagsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(TAGS_COLLAPSED_KEY) === "true";
    } catch { return false; }
  });

  const toggleTagsCollapsed = () => {
    const next = !tagsCollapsed;
    setTagsCollapsed(next);
    try { localStorage.setItem(TAGS_COLLAPSED_KEY, String(next)); } catch { /* */ }
  };

  // Theme toggle
  const mode = themeMode.value;
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(mode) + 1) % THEME_CYCLE.length];

  return (
    <nav class={styles.navSidebar} aria-label="Navigation">
      <div class={styles.navContent}>
        {/* All Notes */}
        <button
          class={`${styles.menuItem} ${!activeTag ? styles.menuItemActive : ""}`}
          onClick={() => (activeTagFilter.value = null)}
        >
          <FileText size={16} class={styles.menuIcon} />
          <span class={styles.menuLabel}>All Notes</span>
          <span class={styles.menuBadge}>{count}</span>
        </button>

        {/* Tags section */}
        {tags.size > 0 && (
          <>
            <div class={styles.sectionDivider} />
            <button
              class={styles.sectionHeader}
              onClick={toggleTagsCollapsed}
              aria-expanded={!tagsCollapsed}
              aria-controls="nav-tags-list"
            >
              {tagsCollapsed
                ? <ChevronRight size={10} />
                : <ChevronDown size={10} />}
              <span>Tags</span>
            </button>
            {!tagsCollapsed && (
              <div id="nav-tags-list">
                {Array.from(tags.entries())
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([tag, tagCount]) => (
                    <button
                      key={tag}
                      class={`${styles.tagItem} ${activeTag === tag ? styles.tagItemActive : ""}`}
                      onClick={() =>
                        (activeTagFilter.value = activeTag === tag ? null : tag)
                      }
                    >
                      <Hash size={12} class={styles.tagHash} />
                      <span class={styles.menuLabel}>{tag}</span>
                      <span class={styles.menuBadge}>{tagCount}</span>
                    </button>
                  ))}
              </div>
            )}
          </>
        )}

        {/* Favorites section */}
        {favorites.length > 0 && (
          <>
            <div class={styles.sectionDivider} />
            <button
              class={styles.sectionHeader}
              onClick={() => setFavoritesCollapsed(!favCollapsed)}
              aria-expanded={!favCollapsed}
              aria-controls="nav-favorites-list"
            >
              {favCollapsed
                ? <ChevronRight size={10} />
                : <ChevronDown size={10} />}
              <span>Favorites</span>
            </button>
            {!favCollapsed && (
              <div id="nav-favorites-list" role="list">
                {favorites.map((note, i) => (
                  <NavFavoriteItem
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
          </>
        )}
      </div>

      <div class={styles.footer}>
        <button
          class={styles.footerBtn}
          onClick={() => setTheme(next)}
          title={`Theme: ${THEME_LABELS[mode]} (click for ${THEME_LABELS[next]})`}
          aria-label={`Switch theme to ${THEME_LABELS[next]}`}
        >
          {mode === "light" && <Sun size={14} />}
          {mode === "dark" && <Moon size={14} />}
          {mode === "system" && <Monitor size={14} />}
          <span>{THEME_LABELS[mode]}</span>
        </button>
        {onChangeStorage && (
          <button
            class={styles.footerBtn}
            onClick={onChangeStorage}
            title="Change storage location"
            aria-label="Change storage"
          >
            <FolderSync size={14} />
          </button>
        )}
        <button
          class={styles.footerBtn}
          onClick={() => (agentPanelOpen.value = !agentPanelOpen.value)}
          title="AI Assistant (Cmd+Shift+A)"
          aria-label="Toggle AI assistant"
        >
          <Bot size={14} />
          <span>AI</span>
        </button>
      </div>
    </nav>
  );
}

interface NavFavoriteItemProps {
  note: Note;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

function NavFavoriteItem({ note, index, isSelected, onSelect, onRemove }: NavFavoriteItemProps) {
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
      <span class={styles.favoriteLabel}>{note.title}</span>
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
