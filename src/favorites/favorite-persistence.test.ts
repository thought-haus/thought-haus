import { describe, it, expect, beforeEach, vi } from "vitest";
import { favoriteIds } from "./favorite-store.ts";
import { notesMap } from "../notes/note-store.ts";
import { loadFavorites, saveFavorites } from "./favorite-persistence.ts";
import type { StorageBackend } from "../storage/backend.ts";
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

function mockBackend(overrides: Partial<StorageBackend> = {}): StorageBackend {
  return {
    name: "test",
    list: vi.fn(),
    read: vi.fn(),
    write: vi.fn(),
    remove: vi.fn(),
    readFromDir: vi.fn().mockRejectedValue(new Error("not found")),
    writeToDir: vi.fn().mockResolvedValue(undefined),
    writeBinary: vi.fn(),
    readBinaryURL: vi.fn(),
    listDir: vi.fn(),
    deleteDir: vi.fn(),
    ...overrides,
  } as unknown as StorageBackend;
}

describe("favorite-persistence", () => {
  beforeEach(() => {
    favoriteIds.value = [];
    notesMap.value = new Map([
      ["a", makeNote({ id: "a" })],
      ["b", makeNote({ id: "b" })],
      ["c", makeNote({ id: "c" })],
    ]);
  });

  describe("loadFavorites", () => {
    it("parses valid JSON", async () => {
      const backend = mockBackend({
        readFromDir: vi.fn().mockResolvedValue(
          JSON.stringify({ version: 1, favorites: ["a", "b"] }),
        ),
      });
      await loadFavorites(backend);
      expect(favoriteIds.value).toEqual(["a", "b"]);
      expect(backend.readFromDir).toHaveBeenCalledWith(".noti", "favorites.json");
    });

    it("handles missing file", async () => {
      const backend = mockBackend();
      await loadFavorites(backend);
      expect(favoriteIds.value).toEqual([]);
    });

    it("handles corrupt JSON", async () => {
      const backend = mockBackend({
        readFromDir: vi.fn().mockResolvedValue("not valid json{{{"),
      });
      await loadFavorites(backend);
      expect(favoriteIds.value).toEqual([]);
    });

    it("handles wrong version", async () => {
      const backend = mockBackend({
        readFromDir: vi.fn().mockResolvedValue(
          JSON.stringify({ version: 99, favorites: ["a"] }),
        ),
      });
      await loadFavorites(backend);
      expect(favoriteIds.value).toEqual([]);
    });
  });

  describe("saveFavorites", () => {
    it("writes correct JSON", async () => {
      favoriteIds.value = ["a", "b"];
      const backend = mockBackend();
      await saveFavorites(backend);
      expect(backend.writeToDir).toHaveBeenCalledWith(
        ".noti",
        "favorites.json",
        JSON.stringify({ version: 1, favorites: ["a", "b"] }, null, 2),
      );
    });

    it("prunes stale IDs", async () => {
      favoriteIds.value = ["a", "deleted-id", "b"];
      const backend = mockBackend();
      await saveFavorites(backend);
      expect(favoriteIds.value).toEqual(["a", "b"]);
      expect(backend.writeToDir).toHaveBeenCalledWith(
        ".noti",
        "favorites.json",
        JSON.stringify({ version: 1, favorites: ["a", "b"] }, null, 2),
      );
    });
  });
});
