import { describe, it, expect, beforeEach, vi } from "vitest";
import { notesMap } from "../notes/note-store.ts";
import type { Note } from "../notes/note.ts";

// Mock persistence so debounced saves don't fire real writes
vi.mock("./favorite-persistence.ts", () => ({
  saveFavorites: vi.fn().mockResolvedValue(undefined),
}));

import {
  favoriteIds,
  favoriteNotes,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  moveFavorite,
} from "./favorite-store.ts";

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    properties: {},
    filename: `${overrides.id}.md`,
    lastModified: Date.now(),
    size: 100,
    isTimestampFormat: true,
    createdAt: new Date(2024, 2, 22),
    ...overrides,
  };
}

describe("favorite-store", () => {
  beforeEach(() => {
    favoriteIds.value = [];
    notesMap.value = new Map([
      ["a", makeNote({ id: "a", title: "Alpha" })],
      ["b", makeNote({ id: "b", title: "Beta" })],
      ["c", makeNote({ id: "c", title: "Charlie" })],
    ]);
  });

  it("starts empty", () => {
    expect(favoriteIds.value).toEqual([]);
    expect(isFavorite("a")).toBe(false);
  });

  it("addFavorite adds to front of list", () => {
    addFavorite("b");
    addFavorite("a");
    expect(favoriteIds.value).toEqual(["a", "b"]);
  });

  it("addFavorite with duplicate is a no-op", () => {
    addFavorite("a");
    addFavorite("a");
    expect(favoriteIds.value).toEqual(["a"]);
  });

  it("removeFavorite removes from list", () => {
    addFavorite("a");
    addFavorite("b");
    removeFavorite("a");
    expect(favoriteIds.value).toEqual(["b"]);
  });

  it("removeFavorite with unknown ID is a no-op", () => {
    addFavorite("a");
    removeFavorite("z");
    expect(favoriteIds.value).toEqual(["a"]);
  });

  it("toggleFavorite adds then removes", () => {
    toggleFavorite("a");
    expect(isFavorite("a")).toBe(true);
    toggleFavorite("a");
    expect(isFavorite("a")).toBe(false);
  });

  it("moveFavorite reorders correctly", () => {
    favoriteIds.value = ["a", "b", "c"];
    moveFavorite(0, 2);
    expect(favoriteIds.value).toEqual(["b", "c", "a"]);
  });

  it("moveFavorite from end to beginning", () => {
    favoriteIds.value = ["a", "b", "c"];
    moveFavorite(2, 0);
    expect(favoriteIds.value).toEqual(["c", "a", "b"]);
  });

  it("isFavorite returns correct values", () => {
    addFavorite("b");
    expect(isFavorite("a")).toBe(false);
    expect(isFavorite("b")).toBe(true);
  });

  it("favoriteNotes excludes IDs not in notesMap", () => {
    favoriteIds.value = ["a", "deleted-id", "b"];
    const notes = favoriteNotes.value;
    expect(notes).toHaveLength(2);
    expect(notes[0].id).toBe("a");
    expect(notes[1].id).toBe("b");
  });

  it("favoriteNotes preserves order", () => {
    favoriteIds.value = ["c", "a", "b"];
    const notes = favoriteNotes.value;
    expect(notes.map((n) => n.id)).toEqual(["c", "a", "b"]);
  });
});
