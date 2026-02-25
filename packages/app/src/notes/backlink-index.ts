import { signal } from "@preact/signals";
import { parseNoteLinks } from "../editor/note-links.ts";
import { getNote } from "./note-store.ts";
import type { Note } from "@thought-haus/core";

/**
 * Reactive backlink index: targetNoteId → Set<sourceNoteId>.
 * Updated incrementally on note save/delete and rebuilt on scan.
 */
export const backlinkIndex = signal<Map<string, Set<string>>>(new Map());

/**
 * Track outgoing links per note so we can diff on update.
 * sourceNoteId → Set<targetNoteId>
 */
const outgoingLinks = new Map<string, Set<string>>();

/** Build the full backlink index from note bodies read during scan. */
export function buildBacklinkIndex(
  docs: { id: string; body: string }[],
): void {
  const index = new Map<string, Set<string>>();
  outgoingLinks.clear();

  for (const doc of docs) {
    const links = parseNoteLinks(doc.body);
    const targets = new Set<string>();

    for (const link of links) {
      // Skip self-links
      if (link.id === doc.id) continue;
      targets.add(link.id);

      let sources = index.get(link.id);
      if (!sources) {
        sources = new Set();
        index.set(link.id, sources);
      }
      sources.add(doc.id);
    }

    outgoingLinks.set(doc.id, targets);
  }

  backlinkIndex.value = index;
}

/** Update the backlink index when a single note is saved. */
export function updateNoteLinks(noteId: string, body: string): void {
  const links = parseNoteLinks(body);
  const newTargets = new Set<string>();
  for (const link of links) {
    if (link.id !== noteId) {
      newTargets.add(link.id);
    }
  }

  const oldTargets = outgoingLinks.get(noteId) ?? new Set();

  // Find added and removed targets
  const added = new Set<string>();
  const removed = new Set<string>();

  for (const target of newTargets) {
    if (!oldTargets.has(target)) added.add(target);
  }
  for (const target of oldTargets) {
    if (!newTargets.has(target)) removed.add(target);
  }

  // No changes — skip signal update
  if (added.size === 0 && removed.size === 0) return;

  const index = new Map(backlinkIndex.value);

  for (const target of added) {
    let sources = index.get(target);
    if (!sources) {
      sources = new Set();
      index.set(target, sources);
    } else {
      sources = new Set(sources);
      index.set(target, sources);
    }
    sources.add(noteId);
  }

  for (const target of removed) {
    const sources = index.get(target);
    if (sources) {
      const newSources = new Set(sources);
      newSources.delete(noteId);
      if (newSources.size === 0) {
        index.delete(target);
      } else {
        index.set(target, newSources);
      }
    }
  }

  outgoingLinks.set(noteId, newTargets);
  backlinkIndex.value = index;
}

/** Remove all link entries for a deleted note. */
export function removeNoteLinks(noteId: string): void {
  const targets = outgoingLinks.get(noteId);
  if (!targets || targets.size === 0) {
    outgoingLinks.delete(noteId);

    // Also remove any entries where this note is a target
    if (backlinkIndex.value.has(noteId)) {
      const index = new Map(backlinkIndex.value);
      index.delete(noteId);
      backlinkIndex.value = index;
    }
    return;
  }

  const index = new Map(backlinkIndex.value);

  // Remove this note as a source from all its targets
  for (const target of targets) {
    const sources = index.get(target);
    if (sources) {
      const newSources = new Set(sources);
      newSources.delete(noteId);
      if (newSources.size === 0) {
        index.delete(target);
      } else {
        index.set(target, newSources);
      }
    }
  }

  // Remove this note as a target (other notes linking to it are now linking to a deleted note)
  index.delete(noteId);

  outgoingLinks.delete(noteId);
  backlinkIndex.value = index;
}

/** Get notes that link to the given note, sorted by creation date (newest first). */
export function getBacklinks(noteId: string): Note[] {
  const sources = backlinkIndex.value.get(noteId);
  if (!sources || sources.size === 0) return [];

  const notes: Note[] = [];
  for (const sourceId of sources) {
    const note = getNote(sourceId);
    // Only include notes that still exist in the store
    if (note) notes.push(note);
  }

  // Sort newest first by creation date
  notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return notes;
}

/** Clear the backlink index (e.g. on disconnect). */
export function clearBacklinks(): void {
  outgoingLinks.clear();
  backlinkIndex.value = new Map();
}
