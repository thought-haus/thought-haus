import { describe, it, expect, beforeEach } from "vitest";
import {
  notesMap,
  notesSorted,
  tagCounts,
  allPropertyKeys,
  noteCount,
  activeTagFilter,
  filteredNotes,
  setNotes,
  upsertNote,
  removeNote,
  getNote,
} from "./note-store.ts";
import { sortMode, sortDirection } from "../lib/app-state.ts";
import type { Note } from "./note.ts";

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    properties: {},
    filename: `${overrides.id}.md`,
    lastModified: Date.now(),
    size: 100,
    isNotiFormat: true,
    createdAt: new Date(2024, 2, 22),
    ...overrides,
  };
}

describe("note-store", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    activeTagFilter.value = null;
    sortMode.value = "created";
    sortDirection.value = "desc";
  });

  it("starts with empty notes", () => {
    expect(noteCount.value).toBe(0);
    expect(notesSorted.value).toEqual([]);
  });

  it("setNotes populates the store", () => {
    setNotes([
      makeNote({ id: "1", title: "First" }),
      makeNote({ id: "2", title: "Second" }),
    ]);
    expect(noteCount.value).toBe(2);
  });

  it("notesSorted returns notes sorted by date (newest first)", () => {
    setNotes([
      makeNote({
        id: "1",
        title: "Old",
        createdAt: new Date(2023, 0, 1),
      }),
      makeNote({
        id: "2",
        title: "New",
        createdAt: new Date(2024, 5, 1),
      }),
    ]);
    expect(notesSorted.value[0].title).toBe("New");
    expect(notesSorted.value[1].title).toBe("Old");
  });

  it("tagCounts computes correct tag frequencies", () => {
    setNotes([
      makeNote({ id: "1", tags: ["work", "project"] }),
      makeNote({ id: "2", tags: ["work"] }),
      makeNote({ id: "3", tags: ["personal"] }),
    ]);
    expect(tagCounts.value.get("work")).toBe(2);
    expect(tagCounts.value.get("project")).toBe(1);
    expect(tagCounts.value.get("personal")).toBe(1);
  });

  it("upsertNote adds a new note", () => {
    upsertNote(makeNote({ id: "1", title: "Added" }));
    expect(noteCount.value).toBe(1);
    expect(getNote("1")?.title).toBe("Added");
  });

  it("upsertNote updates an existing note", () => {
    upsertNote(makeNote({ id: "1", title: "Original" }));
    upsertNote(makeNote({ id: "1", title: "Updated" }));
    expect(noteCount.value).toBe(1);
    expect(getNote("1")?.title).toBe("Updated");
  });

  it("removeNote removes a note", () => {
    setNotes([makeNote({ id: "1" }), makeNote({ id: "2" })]);
    removeNote("1");
    expect(noteCount.value).toBe(1);
    expect(getNote("1")).toBeUndefined();
  });

  it("filteredNotes filters by active tag", () => {
    setNotes([
      makeNote({ id: "1", tags: ["work"] }),
      makeNote({ id: "2", tags: ["personal"] }),
      makeNote({ id: "3", tags: ["work", "project"] }),
    ]);
    activeTagFilter.value = "work";
    expect(filteredNotes.value.length).toBe(2);
    expect(filteredNotes.value.every((n) => n.tags.includes("work"))).toBe(
      true,
    );
  });

  it("filteredNotes returns all when no tag filter", () => {
    setNotes([
      makeNote({ id: "1", tags: ["work"] }),
      makeNote({ id: "2", tags: ["personal"] }),
    ]);
    expect(filteredNotes.value.length).toBe(2);
  });

  describe("allPropertyKeys", () => {
    it("returns sorted unique property keys across all notes", () => {
      setNotes([
        makeNote({ id: "1", properties: { status: "active", priority: "high" } }),
        makeNote({ id: "2", properties: { status: "done", owner: "Alice" } }),
        makeNote({ id: "3", properties: { due: "2026-01-01" } }),
      ]);
      expect(allPropertyKeys.value).toEqual(["due", "owner", "priority", "status"]);
    });

    it("returns empty array when no notes have properties", () => {
      setNotes([
        makeNote({ id: "1", properties: {} }),
        makeNote({ id: "2", properties: {} }),
      ]);
      expect(allPropertyKeys.value).toEqual([]);
    });

    it("updates when a note with new property key is added", () => {
      setNotes([
        makeNote({ id: "1", properties: { status: "active" } }),
      ]);
      expect(allPropertyKeys.value).toEqual(["status"]);

      upsertNote(makeNote({ id: "2", properties: { priority: "high" } }));
      expect(allPropertyKeys.value).toEqual(["priority", "status"]);
    });

    it("updates when a note with properties is removed", () => {
      setNotes([
        makeNote({ id: "1", properties: { status: "active" } }),
        makeNote({ id: "2", properties: { priority: "high" } }),
      ]);
      expect(allPropertyKeys.value).toEqual(["priority", "status"]);

      removeNote("2");
      expect(allPropertyKeys.value).toEqual(["status"]);
    });
  });
});
