import { signal, computed } from "@preact/signals";
import { sortMode, sortDirection } from "../lib/app-state.ts";
import type { Note } from "./note.ts";

/** In-memory collection of all notes, keyed by ID. */
export const notesMap = signal<Map<string, Note>>(new Map());

/** All notes sorted according to the active sort mode and direction. */
export const notesSorted = computed(() => {
  const notes = Array.from(notesMap.value.values());
  const mode = sortMode.value;
  const dir = sortDirection.value;
  const mult = dir === "asc" ? 1 : -1;

  return notes.sort((a, b) => {
    switch (mode) {
      case "created":
        return mult * (a.createdAt.getTime() - b.createdAt.getTime()) || a.title.localeCompare(b.title);
      case "title":
        return mult * a.title.localeCompare(b.title) || b.createdAt.getTime() - a.createdAt.getTime();
      case "modified":
        return mult * (a.lastModified - b.lastModified) || a.title.localeCompare(b.title);
    }
  });
});

/** All unique tags with their note counts. */
export const tagCounts = computed(() => {
  const counts = new Map<string, number>();
  for (const note of notesMap.value.values()) {
    for (const tag of note.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return counts;
});

/** All unique property keys across all notes, sorted alphabetically. */
export const allPropertyKeys = computed(() => {
  const keys = new Set<string>();
  for (const note of notesMap.value.values()) {
    for (const key of Object.keys(note.properties)) {
      keys.add(key);
    }
  }
  return Array.from(keys).sort();
});

/** Total number of notes. */
export const noteCount = computed(() => notesMap.value.size);

/** Currently active tag filter. */
export const activeTagFilter = signal<string | null>(null);

/** Notes filtered by active tag. */
export const filteredNotes = computed(() => {
  const tag = activeTagFilter.value;
  if (!tag) return notesSorted.value;
  return notesSorted.value.filter((n) => n.tags.includes(tag));
});

/** Set all notes at once (e.g. after directory scan). */
export function setNotes(notes: Note[]): void {
  const map = new Map<string, Note>();
  for (const note of notes) {
    map.set(note.id, note);
  }
  notesMap.value = map;
}

/** Add or update a single note. */
export function upsertNote(note: Note): void {
  const map = new Map(notesMap.value);
  map.set(note.id, note);
  notesMap.value = map;
}

/** Remove a note by ID. */
export function removeNote(id: string): void {
  const map = new Map(notesMap.value);
  map.delete(id);
  notesMap.value = map;
}

/** Clear all notes. */
export function clearNotes(): void {
  notesMap.value = new Map();
}

/** Get a note by ID. */
export function getNote(id: string): Note | undefined {
  return notesMap.value.get(id);
}
