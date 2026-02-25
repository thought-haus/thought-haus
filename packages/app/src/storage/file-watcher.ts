import type { Note, StorageBackend } from "@thought-haus/core";
import { parseFrontMatter } from "@thought-haus/core";
import { scanNotes } from "./scan.ts";
import { getNote, upsertNote, removeNote, notesMap } from "../notes/note-store.ts";
import { selectedNoteId } from "../lib/app-state.ts";
import {
  addToIndex,
  removeFromIndex,
  updateInIndex,
} from "../search/search-engine.ts";
import { removeFavorite } from "../favorites/favorite-store.ts";
import { updateNoteLinks, removeNoteLinks } from "../notes/backlink-index.ts";

const POLL_INTERVAL = 7000; // 7 seconds

export interface FileChange {
  type: "added" | "deleted" | "modified";
  note: Note;
}

/** Compare previous note state with a fresh scan to detect changes. */
export function diffChanges(
  previous: Map<string, Note>,
  current: Note[],
): FileChange[] {
  const changes: FileChange[] = [];
  const currentMap = new Map<string, Note>();

  for (const note of current) {
    currentMap.set(note.id, note);
  }

  // Detect added and modified files
  for (const note of current) {
    const prev = previous.get(note.id);
    if (!prev) {
      changes.push({ type: "added", note });
    } else if (
      note.lastModified !== prev.lastModified ||
      note.size !== prev.size
    ) {
      changes.push({ type: "modified", note });
    }
  }

  // Detect deleted files
  for (const [id] of previous) {
    if (!currentMap.has(id)) {
      changes.push({ type: "deleted", note: previous.get(id)! });
    }
  }

  return changes;
}

/** Apply detected changes to the note store and search index. */
export async function applyChanges(
  changes: FileChange[],
  backend: StorageBackend,
): Promise<void> {
  for (const change of changes) {
    switch (change.type) {
      case "added": {
        upsertNote(change.note);
        const raw = await backend.read(change.note.filename);
        const { body } = parseFrontMatter(raw);
        addToIndex({
          id: change.note.id,
          title: change.note.title,
          tags: change.note.tags,
          body,
          lastModified: change.note.lastModified,
        });
        updateNoteLinks(change.note.id, body);
        break;
      }
      case "deleted": {
        removeNote(change.note.id);
        removeFromIndex(change.note.id);
        removeFavorite(change.note.id);
        removeNoteLinks(change.note.id);
        if (selectedNoteId.value === change.note.id) {
          selectedNoteId.value = null;
        }
        break;
      }
      case "modified": {
        const existing = getNote(change.note.id);
        if (existing) {
          upsertNote(change.note);
        }
        const raw = await backend.read(change.note.filename);
        const { body } = parseFrontMatter(raw);
        updateInIndex({
          id: change.note.id,
          title: change.note.title,
          tags: change.note.tags,
          body,
          lastModified: change.note.lastModified,
        });
        updateNoteLinks(change.note.id, body);
        break;
      }
    }
  }
}

/** Perform a single poll: scan backend, diff, and apply changes. */
export async function poll(
  backend: StorageBackend,
): Promise<FileChange[]> {
  const currentNotes = await scanNotes(backend);
  const previous = notesMap.value;
  const changes = diffChanges(previous, currentNotes);
  if (changes.length > 0) {
    await applyChanges(changes, backend);
  }
  return changes;
}

/** Start watching a backend for external changes. Returns a cleanup function. */
export function startWatcher(
  backend: StorageBackend,
): () => void {
  let stopped = false;

  // Polling timer
  const timer = setInterval(() => {
    if (!stopped) {
      poll(backend).catch(() => {});
    }
  }, POLL_INTERVAL);

  // Re-scan on window focus
  const handleFocus = () => {
    if (!stopped) {
      poll(backend).catch(() => {});
    }
  };
  window.addEventListener("focus", handleFocus);

  // Progressive enhancement: use backend's native change events if available
  const cleanupNative = backend.onExternalChange?.(() => {
    if (!stopped) {
      poll(backend).catch(() => {});
    }
  });

  return () => {
    stopped = true;
    clearInterval(timer);
    window.removeEventListener("focus", handleFocus);
    cleanupNative?.();
  };
}
