import { useEffect, useState, useRef, useCallback } from "preact/hooks";
import { commandPaletteOpen, closeCommandPalette } from "../lib/command-palette-state.ts";
import { selectedNoteId } from "../lib/app-state.ts";
import { getNote } from "../notes/note-store.ts";
import { queryIndex } from "../search/search-engine.ts";
import { recentlyViewedNotes, trackRecentlyViewed } from "../recently-viewed/recently-viewed-store.ts";
import { FileText, Search, X } from "lucide-preact";
import type { Note } from "@thought-haus/core";
import styles from "./command-palette.module.css";

const MAX_RESULTS = 20;
const CLOSE_ANIMATION_MS = 100;

function relativeDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function CommandPalette() {
  const isOpen = commandPaletteOpen.value;
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isSearching = query.trim().length > 0;

  const notes: Note[] = isSearching
    ? queryIndex(query)
        .slice(0, MAX_RESULTS)
        .map((r) => getNote(r.id))
        .filter((n): n is Note => n !== undefined)
    : recentlyViewedNotes.value;

  const animatedClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      closeCommandPalette();
      setClosing(false);
      setQuery("");
      setHighlightedIndex(0);
    }, CLOSE_ANIMATION_MS);
  }, []);

  const selectNote = useCallback(
    (id: string) => {
      selectedNoteId.value = id;
      trackRecentlyViewed(id);
      animatedClose();
    },
    [animatedClose],
  );

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setHighlightedIndex(0);
      setClosing(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll(`button`);
    const item = items[highlightedIndex];
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Cmd+K while open: select all text in input
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.select();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        animatedClose();
        return;
      }

      const isDown =
        e.key === "ArrowDown" ||
        (e.ctrlKey && e.key === "n") ||
        (e.ctrlKey && e.key === "j");
      const isUp =
        e.key === "ArrowUp" ||
        (e.ctrlKey && e.key === "p") ||
        (e.ctrlKey && e.key === "k");

      if (isDown) {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          notes.length === 0 ? 0 : (prev + 1) % notes.length,
        );
        return;
      }

      if (isUp) {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          notes.length === 0
            ? 0
            : (prev - 1 + notes.length) % notes.length,
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < notes.length) {
          selectNote(notes[highlightedIndex].id);
        }
        return;
      }
    },
    [notes, highlightedIndex, selectNote, animatedClose],
  );

  if (!isOpen) return null;

  const closingClass = closing ? ` ${styles.backdropClosing}` : "";
  const paletteClosingClass = closing ? ` ${styles.paletteClosing}` : "";

  return (
    <>
      <div
        class={`${styles.backdrop}${closingClass}`}
        onClick={animatedClose}
      />
      <div
        class={`${styles.palette}${paletteClosingClass}`}
        role="dialog"
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
      >
        <div class={styles.inputArea}>
          <Search
            size={16}
            class={`${styles.searchIcon} ${styles.searchIconFocused}`}
          />
          <input
            ref={inputRef}
            class={styles.input}
            type="text"
            value={query}
            placeholder="Search notes..."
            aria-label="Search notes"
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
          <div class={styles.inputTrailing}>
            {isSearching ? (
              <button
                class={styles.clearBtn}
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : (
              <span class={styles.escBadge}>Esc</span>
            )}
          </div>
        </div>

        <div class={styles.resultsList} ref={listRef}>
          <div class={styles.sectionHeader}>
            {isSearching
              ? `Search Results (${notes.length})`
              : "Recently Viewed"}
          </div>
          {notes.length === 0 ? (
            <div class={styles.emptyState}>
              {isSearching ? "No matching notes" : "No recently viewed notes"}
            </div>
          ) : (
            notes.map((note, i) => (
              <button
                key={note.id}
                class={`${styles.resultItem} ${i === highlightedIndex ? styles.resultItemHighlighted : ""}`}
                onClick={() => selectNote(note.id)}
                onMouseEnter={() => setHighlightedIndex(i)}
              >
                <FileText size={16} class={styles.resultIcon} />
                <div class={styles.resultContent}>
                  <span class={styles.resultTitle}>{note.title}</span>
                  {note.tags.length > 0 && (
                    <div class={styles.resultTags}>
                      {note.tags.slice(0, 2).map((tag) => (
                        <span key={tag} class={styles.resultTag}>
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 2 && (
                        <span class={styles.resultTag}>
                          +{note.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span class={styles.resultDate}>
                  {relativeDate(note.lastModified)}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
