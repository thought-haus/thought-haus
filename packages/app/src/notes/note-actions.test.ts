import { describe, it, expect, vi, beforeEach } from "vitest";
import { storageBackend, selectedNoteId } from "../lib/app-state.ts";
import { notesMap, noteCount } from "./note-store.ts";
import {
  createNote,
  deleteNote,
  createWelcomeNote,
  renameNote,
} from "./note-actions.ts";
import { getNote } from "./note-store.ts";
import type { StorageBackend } from "@thought-haus/core";

vi.mock("../search/search-engine.ts", () => ({
  addToIndex: vi.fn(),
  removeFromIndex: vi.fn(),
  updateInIndex: vi.fn(),
}));

const mockBackend: StorageBackend = {
  type: "local" as const,
  name: "test-folder",
  list: vi.fn(() => Promise.resolve([])),
  read: vi.fn(() =>
    Promise.resolve("---\ntitle: Test\ntags:\n---\nContent"),
  ),
  write: vi.fn(() =>
    Promise.resolve({ lastModified: Date.now(), size: 100 }),
  ),
  delete: vi.fn(() => Promise.resolve()),
  getMetadata: vi.fn(() =>
    Promise.resolve({ lastModified: Date.now(), size: 100 }),
  ),
  writeBinary: vi.fn(() => Promise.resolve()),
  readBinaryURL: vi.fn(() => Promise.resolve("blob:test")),
  listDir: vi.fn(() => Promise.resolve([])),
  deleteDir: vi.fn(() => Promise.resolve()),
  readFromDir: vi.fn(() => Promise.reject(new Error("not found"))),
  writeToDir: vi.fn(() => Promise.resolve()),
  disconnect: vi.fn(),
};

describe("note-actions", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    selectedNoteId.value = null;
    storageBackend.value = mockBackend;
    vi.clearAllMocks();
  });

  describe("createNote", () => {
    it("creates a new note and adds it to the store", async () => {
      const note = await createNote();
      expect(note).not.toBeNull();
      expect(note!.title).toBe("Untitled");
      expect(note!.isTimestampFormat).toBe(true);
      expect(noteCount.value).toBe(1);
    });

    it("selects the new note", async () => {
      const note = await createNote();
      expect(selectedNoteId.value).toBe(note!.id);
    });

    it("returns null if no backend", async () => {
      storageBackend.value = null;
      const note = await createNote();
      expect(note).toBeNull();
    });

    it("writes front matter via backend.write", async () => {
      await createNote();
      expect(mockBackend.write).toHaveBeenCalled();
      const content = String((mockBackend.write as ReturnType<typeof vi.fn>).mock.lastCall?.[1]);
      expect(content).toContain("title: Untitled");
      expect(content).toContain("tags:");
    });
  });

  describe("deleteNote", () => {
    it("deletes a note from the store and disk", async () => {
      const note = await createNote();
      expect(noteCount.value).toBe(1);
      const result = await deleteNote(note!.id);
      expect(result).toBe(true);
      expect(noteCount.value).toBe(0);
      expect(mockBackend.delete).toHaveBeenCalledWith(note!.filename);
    });

    it("clears selection if deleted note was selected", async () => {
      const note = await createNote();
      expect(selectedNoteId.value).toBe(note!.id);
      await deleteNote(note!.id);
      expect(selectedNoteId.value).toBeNull();
    });

    it("returns false if no backend", async () => {
      storageBackend.value = null;
      const result = await deleteNote("nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("createWelcomeNote", () => {
    it("creates a welcome note with getting-started tag", async () => {
      const note = await createWelcomeNote();
      expect(note).not.toBeNull();
      expect(note!.title).toBe("Welcome to Thought.Haus");
      expect(note!.tags).toContain("getting-started");
    });

    it("writes welcome content to file", async () => {
      await createWelcomeNote();
      const content = String((mockBackend.write as ReturnType<typeof vi.fn>).mock.lastCall?.[1]);
      expect(content).toContain("Welcome to Thought.Haus");
      expect(content).toContain("Getting Started");
    });
  });

  describe("renameNote", () => {
    it("updates title in store and creates new file, deletes old", async () => {
      const note = await createNote();
      const oldFilename = note!.filename;
      vi.clearAllMocks();

      const result = await renameNote(note!.id, "My New Title");

      expect(result).toBe(true);
      const updated = getNote(note!.id);
      expect(updated!.title).toBe("My New Title");
      expect(updated!.filename).toContain("my-new-title");
      expect(updated!.filename).not.toBe(oldFilename);
      // Should write new file and delete old
      expect(mockBackend.write).toHaveBeenCalled();
      expect(mockBackend.delete).toHaveBeenCalledWith(oldFilename);
    });

    it("falls back to 'Untitled' when given empty string", async () => {
      const note = await createNote();
      vi.clearAllMocks();

      const result = await renameNote(note!.id, "  ");

      expect(result).toBe(true);
      const updated = getNote(note!.id);
      expect(updated!.title).toBe("Untitled");
    });

    it("slugifies special characters in filename", async () => {
      const note = await createNote();
      vi.clearAllMocks();

      await renameNote(note!.id, "Hello, World! @#$%");

      const updated = getNote(note!.id);
      expect(updated!.filename).toContain("hello-world");
      expect(updated!.filename).not.toContain("@");
      expect(updated!.filename).not.toContain("!");
    });

    it("returns false if no backend", async () => {
      const note = await createNote();
      storageBackend.value = null;
      const result = await renameNote(note!.id, "New Title");
      expect(result).toBe(false);
    });

    it("returns true without changes if title is the same", async () => {
      const note = await createNote();
      vi.clearAllMocks();

      const result = await renameNote(note!.id, "Untitled");

      expect(result).toBe(true);
      // Should not have written any files
      expect(mockBackend.write).not.toHaveBeenCalled();
    });
  });
});
