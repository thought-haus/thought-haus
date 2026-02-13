import { describe, it, expect, vi, beforeEach } from "vitest";
import { diffChanges, applyChanges, poll } from "./file-watcher.ts";
import { notesMap, setNotes, getNote } from "../notes/note-store.ts";
import { selectedNoteId } from "../lib/app-state.ts";
import type { Note } from "../notes/note.ts";
import type { StorageBackend } from "./backend.ts";

vi.mock("../search/search-engine.ts", () => ({
  addToIndex: vi.fn(),
  removeFromIndex: vi.fn(),
  updateInIndex: vi.fn(),
}));

vi.mock("./scan.ts", () => ({
  scanNotes: vi.fn(),
}));

import {
  addToIndex,
  removeFromIndex,
  updateInIndex,
} from "../search/search-engine.ts";
import { scanNotes } from "./scan.ts";

const mockBackend: StorageBackend = {
  type: "local" as const,
  name: "test-folder",
  list: vi.fn(() => Promise.resolve([])),
  read: vi.fn(() =>
    Promise.resolve("---\ntitle: Test\ntags:\n---\nBody content"),
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
  disconnect: vi.fn(),
};

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    filename: `${overrides.id}--test-note.md`,
    lastModified: 1000,
    size: 100,
    isNotiFormat: true,
    createdAt: new Date("2024-03-22T13:18:56"),
    ...overrides,
  };
}

describe("diffChanges", () => {
  it("detects added files", () => {
    const previous = new Map<string, Note>();
    const current = [makeNote({ id: "20240322T131856" })];

    const changes = diffChanges(previous, current);

    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("added");
    expect(changes[0].note.id).toBe("20240322T131856");
  });

  it("detects deleted files", () => {
    const note = makeNote({ id: "20240322T131856" });
    const previous = new Map<string, Note>([["20240322T131856", note]]);
    const current: Note[] = [];

    const changes = diffChanges(previous, current);

    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("deleted");
    expect(changes[0].note.id).toBe("20240322T131856");
  });

  it("detects modified files by lastModified", () => {
    const note = makeNote({ id: "20240322T131856", lastModified: 1000 });
    const previous = new Map<string, Note>([["20240322T131856", note]]);
    const current = [
      makeNote({ id: "20240322T131856", lastModified: 2000 }),
    ];

    const changes = diffChanges(previous, current);

    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("modified");
  });

  it("detects modified files by size", () => {
    const note = makeNote({ id: "20240322T131856", size: 100 });
    const previous = new Map<string, Note>([["20240322T131856", note]]);
    const current = [makeNote({ id: "20240322T131856", size: 200 })];

    const changes = diffChanges(previous, current);

    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("modified");
  });

  it("ignores unchanged files", () => {
    const note = makeNote({
      id: "20240322T131856",
      lastModified: 1000,
      size: 100,
    });
    const previous = new Map<string, Note>([["20240322T131856", note]]);
    const current = [
      makeNote({ id: "20240322T131856", lastModified: 1000, size: 100 }),
    ];

    const changes = diffChanges(previous, current);

    expect(changes).toHaveLength(0);
  });

  it("returns empty for empty directory", () => {
    const previous = new Map<string, Note>();
    const current: Note[] = [];

    const changes = diffChanges(previous, current);

    expect(changes).toHaveLength(0);
  });

  it("detects multiple simultaneous changes", () => {
    const existing = makeNote({ id: "20240101T000000", lastModified: 1000 });
    const toDelete = makeNote({ id: "20240102T000000" });
    const previous = new Map<string, Note>([
      ["20240101T000000", existing],
      ["20240102T000000", toDelete],
    ]);
    const current = [
      makeNote({ id: "20240101T000000", lastModified: 2000 }), // modified
      makeNote({ id: "20240103T000000" }), // added
      // 20240102T000000 deleted
    ];

    const changes = diffChanges(previous, current);

    expect(changes).toHaveLength(3);
    const types = changes.map((c) => c.type).sort();
    expect(types).toEqual(["added", "deleted", "modified"]);
  });
});

describe("applyChanges", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    selectedNoteId.value = null;
    vi.clearAllMocks();
  });

  it("adds new notes to store and search index", async () => {
    const note = makeNote({ id: "20240322T131856" });
    await applyChanges([{ type: "added", note }], mockBackend);

    expect(getNote("20240322T131856")).toBeDefined();
    expect(addToIndex).toHaveBeenCalledWith(
      expect.objectContaining({ id: "20240322T131856" }),
    );
  });

  it("removes deleted notes from store and search index", async () => {
    const note = makeNote({ id: "20240322T131856" });
    setNotes([note]);

    await applyChanges([{ type: "deleted", note }], mockBackend);

    expect(getNote("20240322T131856")).toBeUndefined();
    expect(removeFromIndex).toHaveBeenCalledWith("20240322T131856");
  });

  it("clears selected note if deleted note was selected", async () => {
    const note = makeNote({ id: "20240322T131856" });
    setNotes([note]);
    selectedNoteId.value = "20240322T131856";

    await applyChanges([{ type: "deleted", note }], mockBackend);

    expect(selectedNoteId.value).toBeNull();
  });

  it("updates modified notes in store and search index", async () => {
    const note = makeNote({ id: "20240322T131856", lastModified: 1000 });
    setNotes([note]);

    const updated = makeNote({
      id: "20240322T131856",
      lastModified: 2000,
      title: "Updated Title",
    });
    await applyChanges([{ type: "modified", note: updated }], mockBackend);

    const stored = getNote("20240322T131856");
    expect(stored?.lastModified).toBe(2000);
    expect(updateInIndex).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "20240322T131856",
        title: "Updated Title",
      }),
    );
  });

  it("reads file content for search indexing on add", async () => {
    const note = makeNote({ id: "20240322T131856" });
    await applyChanges([{ type: "added", note }], mockBackend);

    expect(mockBackend.read).toHaveBeenCalledWith(note.filename);
    expect(addToIndex).toHaveBeenCalledWith(
      expect.objectContaining({ body: "Body content" }),
    );
  });
});

describe("poll", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    vi.clearAllMocks();
  });

  it("detects and applies changes from backend scan", async () => {
    const note = makeNote({ id: "20240322T131856" });
    vi.mocked(scanNotes).mockResolvedValue([note]);

    const changes = await poll(mockBackend);

    expect(changes).toHaveLength(1);
    expect(changes[0].type).toBe("added");
    expect(getNote("20240322T131856")).toBeDefined();
  });

  it("returns empty array when nothing changed", async () => {
    const note = makeNote({ id: "20240322T131856" });
    setNotes([note]);
    vi.mocked(scanNotes).mockResolvedValue([note]);

    const changes = await poll(mockBackend);

    expect(changes).toHaveLength(0);
  });
});
