import { signal, computed } from "@preact/signals";
import type { Note } from "./note.ts";

/** In-memory collection of all notes, keyed by ID. */
export const notesMap = signal<Map<string, Note>>(new Map());

/** All notes sorted by creation date (newest first). */
export const notesSorted = computed(() => {
  const notes = Array.from(notesMap.value.values());
  return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

/** Get a note by ID. */
export function getNote(id: string): Note | undefined {
  return notesMap.value.get(id);
}
