import { describe, it, expect, beforeEach } from "vitest";
import {
  notesMap,
  tagCounts,
  activeTagFilter,
  filteredNotes,
  setNotes,
  upsertNote,
  getNote,
  removeNote,
} from "../notes/note-store.ts";
import type { Note } from "../notes/note.ts";

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

describe("tag management", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    activeTagFilter.value = null;
  });

  describe("adding tags", () => {
    it("adds a tag to a note", () => {
      const note = makeNote({ id: "1", tags: ["work"] });
      upsertNote(note);

      const updated = { ...note, tags: [...note.tags, "important"] };
      upsertNote(updated);

      expect(getNote("1")?.tags).toEqual(["work", "important"]);
    });

    it("does not add duplicate tags", () => {
      const note = makeNote({ id: "1", tags: ["work"] });
      upsertNote(note);

      // Simulating the addTag logic from editor-view
      const existing = getNote("1")!;
      if (!existing.tags.includes("work")) {
        upsertNote({ ...existing, tags: [...existing.tags, "work"] });
      }

      expect(getNote("1")?.tags).toEqual(["work"]);
    });

    it("updates tag counts when a tag is added", () => {
      setNotes([
        makeNote({ id: "1", tags: ["work"] }),
        makeNote({ id: "2", tags: ["personal"] }),
      ]);

      expect(tagCounts.value.get("work")).toBe(1);

      const note2 = getNote("2")!;
      upsertNote({ ...note2, tags: [...note2.tags, "work"] });

      expect(tagCounts.value.get("work")).toBe(2);
    });

    it("shows new tag in tag counts", () => {
      setNotes([makeNote({ id: "1", tags: ["work"] })]);

      expect(tagCounts.value.has("recipes")).toBe(false);

      const note = getNote("1")!;
      upsertNote({ ...note, tags: [...note.tags, "recipes"] });

      expect(tagCounts.value.get("recipes")).toBe(1);
    });
  });

  describe("removing tags", () => {
    it("removes a tag from a note", () => {
      const note = makeNote({ id: "1", tags: ["work", "project"] });
      upsertNote(note);

      const updated = { ...note, tags: note.tags.filter((t) => t !== "work") };
      upsertNote(updated);

      expect(getNote("1")?.tags).toEqual(["project"]);
    });

    it("decrements tag count when tag is removed", () => {
      setNotes([
        makeNote({ id: "1", tags: ["work", "project"] }),
        makeNote({ id: "2", tags: ["work"] }),
      ]);

      expect(tagCounts.value.get("work")).toBe(2);

      const note1 = getNote("1")!;
      upsertNote({ ...note1, tags: note1.tags.filter((t) => t !== "work") });

      expect(tagCounts.value.get("work")).toBe(1);
    });

    it("removes tag from counts when last note with that tag is updated", () => {
      setNotes([makeNote({ id: "1", tags: ["unique-tag"] })]);

      expect(tagCounts.value.get("unique-tag")).toBe(1);

      const note = getNote("1")!;
      upsertNote({ ...note, tags: [] });

      expect(tagCounts.value.has("unique-tag")).toBe(false);
    });
  });

  describe("tag filtering with edits", () => {
    it("note appears in filter after adding matching tag", () => {
      setNotes([
        makeNote({ id: "1", tags: ["work"] }),
        makeNote({ id: "2", tags: ["personal"] }),
      ]);

      activeTagFilter.value = "work";
      expect(filteredNotes.value.length).toBe(1);

      // Add "work" tag to note 2
      const note2 = getNote("2")!;
      upsertNote({ ...note2, tags: [...note2.tags, "work"] });

      expect(filteredNotes.value.length).toBe(2);
    });

    it("note disappears from filter after removing matching tag", () => {
      setNotes([
        makeNote({ id: "1", tags: ["work"] }),
        makeNote({ id: "2", tags: ["work", "project"] }),
      ]);

      activeTagFilter.value = "work";
      expect(filteredNotes.value.length).toBe(2);

      // Remove "work" tag from note 2
      const note2 = getNote("2")!;
      upsertNote({ ...note2, tags: note2.tags.filter((t) => t !== "work") });

      expect(filteredNotes.value.length).toBe(1);
    });

    it("clears tag filter returns all notes", () => {
      setNotes([
        makeNote({ id: "1", tags: ["work"] }),
        makeNote({ id: "2", tags: ["personal"] }),
      ]);

      activeTagFilter.value = "work";
      expect(filteredNotes.value.length).toBe(1);

      activeTagFilter.value = null;
      expect(filteredNotes.value.length).toBe(2);
    });
  });

  describe("tag counts on note deletion", () => {
    it("updates tag counts when a note is deleted", () => {
      setNotes([
        makeNote({ id: "1", tags: ["work"] }),
        makeNote({ id: "2", tags: ["work", "project"] }),
      ]);

      expect(tagCounts.value.get("work")).toBe(2);
      expect(tagCounts.value.get("project")).toBe(1);

      removeNote("2");

      expect(tagCounts.value.get("work")).toBe(1);
      expect(tagCounts.value.has("project")).toBe(false);
    });
  });

  describe("tag normalization", () => {
    it("handles tag names with spaces by converting to hyphens", () => {
      const raw = "my tag";
      const normalized = raw.trim().toLowerCase().replace(/\s+/g, "-");
      expect(normalized).toBe("my-tag");
    });

    it("lowercases tag names", () => {
      const raw = "Work";
      const normalized = raw.trim().toLowerCase().replace(/\s+/g, "-");
      expect(normalized).toBe("work");
    });

    it("trims whitespace", () => {
      const raw = "  work  ";
      const normalized = raw.trim().toLowerCase().replace(/\s+/g, "-");
      expect(normalized).toBe("work");
    });
  });
});
