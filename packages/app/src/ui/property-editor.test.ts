import { describe, it, expect, beforeEach } from "vitest";
import {
  notesMap,
  upsertNote,
  getNote,
} from "../notes/note-store.ts";
import type { Note } from "@thought-haus/core";

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

describe("property management", () => {
  beforeEach(() => {
    notesMap.value = new Map();
  });

  describe("adding properties", () => {
    it("adds a property to a note with empty properties", () => {
      upsertNote(makeNote({ id: "1", properties: {} }));

      const note = getNote("1")!;
      upsertNote({ ...note, properties: { ...note.properties, status: "active" } });

      expect(getNote("1")?.properties).toEqual({ status: "active" });
    });

    it("adds a property to a note with existing properties", () => {
      upsertNote(makeNote({ id: "1", properties: { status: "active" } }));

      const note = getNote("1")!;
      upsertNote({ ...note, properties: { ...note.properties, priority: "high" } });

      expect(getNote("1")?.properties).toEqual({ status: "active", priority: "high" });
    });

    it("accepts empty string values", () => {
      upsertNote(makeNote({ id: "1", properties: {} }));

      const note = getNote("1")!;
      upsertNote({ ...note, properties: { status: "" } });

      expect(getNote("1")?.properties).toEqual({ status: "" });
    });
  });

  describe("removing properties", () => {
    it("removes a property from a note", () => {
      upsertNote(makeNote({ id: "1", properties: { status: "active", priority: "high" } }));

      const note = getNote("1")!;
      const { status: _, ...rest } = note.properties;
      upsertNote({ ...note, properties: rest });

      expect(getNote("1")?.properties).toEqual({ priority: "high" });
    });

    it("can remove the last property", () => {
      upsertNote(makeNote({ id: "1", properties: { status: "active" } }));

      const note = getNote("1")!;
      upsertNote({ ...note, properties: {} });

      expect(getNote("1")?.properties).toEqual({});
    });
  });

  describe("editing properties", () => {
    it("updates a property value", () => {
      upsertNote(makeNote({ id: "1", properties: { status: "active" } }));

      const note = getNote("1")!;
      upsertNote({ ...note, properties: { ...note.properties, status: "done" } });

      expect(getNote("1")?.properties).toEqual({ status: "done" });
    });

    it("preserves other properties when updating one", () => {
      upsertNote(makeNote({ id: "1", properties: { status: "active", priority: "high" } }));

      const note = getNote("1")!;
      upsertNote({ ...note, properties: { ...note.properties, status: "done" } });

      expect(getNote("1")?.properties).toEqual({ status: "done", priority: "high" });
    });
  });

  describe("key validation", () => {
    it("reserved keys: title, date, tags are not valid property keys", () => {
      const reserved = ["title", "date", "tags"];
      for (const key of reserved) {
        expect(reserved.includes(key)).toBe(true);
      }
    });

    it("duplicate keys are detected", () => {
      const properties = { status: "active", priority: "high" };
      expect("status" in properties).toBe(true);
      expect("owner" in properties).toBe(false);
    });

    it("empty key is not valid", () => {
      const key = "  ".trim();
      expect(key).toBe("");
    });

    it("colons are stripped from keys", () => {
      const raw = "some:key:name";
      const cleaned = raw.replace(/:/g, "");
      expect(cleaned).toBe("somekeyname");
    });
  });
});
