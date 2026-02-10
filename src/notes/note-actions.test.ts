import { describe, it, expect, vi, beforeEach } from "vitest";
import { directoryHandle, selectedNoteId } from "../lib/app-state.ts";
import { notesMap, noteCount } from "./note-store.ts";
import {
  createNote,
  deleteNote,
  createWelcomeNote,
  renameNote,
} from "./note-actions.ts";
import { getNote } from "./note-store.ts";

vi.mock("../search/search-engine.ts", () => ({
  addToIndex: vi.fn(),
  removeFromIndex: vi.fn(),
  updateInIndex: vi.fn(),
}));

// Mock file system
const mockWritable = {
  write: vi.fn((_data: string) => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
};

const mockFileHandle = {
  kind: "file" as const,
  name: "test.md",
  getFile: vi.fn(() =>
    Promise.resolve({
      lastModified: Date.now(),
      size: 100,
      text: () => Promise.resolve("---\ntitle: Test\ntags:\n---\nContent"),
    } as unknown as File),
  ),
  createWritable: vi.fn(() => Promise.resolve(mockWritable)),
};

const mockDirHandle = {
  kind: "directory" as const,
  name: "test-folder",
  getFileHandle: vi.fn(() => Promise.resolve(mockFileHandle)),
  removeEntry: vi.fn(() => Promise.resolve()),
} as unknown as FileSystemDirectoryHandle;

describe("note-actions", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    selectedNoteId.value = null;
    directoryHandle.value = mockDirHandle;
    vi.clearAllMocks();
  });

  describe("createNote", () => {
    it("creates a new note and adds it to the store", async () => {
      const note = await createNote();
      expect(note).not.toBeNull();
      expect(note!.title).toBe("Untitled");
      expect(note!.isNotiFormat).toBe(true);
      expect(noteCount.value).toBe(1);
    });

    it("selects the new note", async () => {
      const note = await createNote();
      expect(selectedNoteId.value).toBe(note!.id);
    });

    it("returns null if no directory handle", async () => {
      directoryHandle.value = null;
      const note = await createNote();
      expect(note).toBeNull();
    });

    it("writes front matter to the file", async () => {
      await createNote();
      expect(mockWritable.write).toHaveBeenCalled();
      const content = String(mockWritable.write.mock.lastCall?.[0]);
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
      expect(mockDirHandle.removeEntry).toHaveBeenCalledWith(note!.filename);
    });

    it("clears selection if deleted note was selected", async () => {
      const note = await createNote();
      expect(selectedNoteId.value).toBe(note!.id);
      await deleteNote(note!.id);
      expect(selectedNoteId.value).toBeNull();
    });

    it("returns false if no directory handle", async () => {
      directoryHandle.value = null;
      const result = await deleteNote("nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("createWelcomeNote", () => {
    it("creates a welcome note with getting-started tag", async () => {
      const note = await createWelcomeNote();
      expect(note).not.toBeNull();
      expect(note!.title).toBe("Welcome to Noti");
      expect(note!.tags).toContain("getting-started");
    });

    it("writes welcome content to file", async () => {
      await createWelcomeNote();
      const content = String(mockWritable.write.mock.lastCall?.[0]);
      expect(content).toContain("Welcome to Noti");
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
      // Should create new file and delete old
      expect(mockDirHandle.getFileHandle).toHaveBeenCalled();
      expect(mockDirHandle.removeEntry).toHaveBeenCalledWith(oldFilename);
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

    it("returns false if no directory handle", async () => {
      const note = await createNote();
      directoryHandle.value = null;
      const result = await renameNote(note!.id, "New Title");
      expect(result).toBe(false);
    });

    it("returns true without changes if title is the same", async () => {
      const note = await createNote();
      vi.clearAllMocks();

      const result = await renameNote(note!.id, "Untitled");

      expect(result).toBe(true);
      // Should not have created any new files
      expect(mockDirHandle.getFileHandle).not.toHaveBeenCalled();
    });
  });
});
