import { describe, it, expect, beforeEach, vi } from "vitest";
import { setNotes } from "../notes/note-store.ts";
import { storageBackend } from "../lib/app-state.ts";
import type { Note } from "../notes/note.ts";
import type { StorageBackend } from "../storage/backend.ts";
import { createTools } from "./tools.ts";

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    properties: {},
    filename: `${overrides.id}--test-note.md`,
    lastModified: Date.now(),
    size: 100,
    isTimestampFormat: true,
    createdAt: new Date("2024-03-22T13:18:56"),
    ...overrides,
  };
}

const mockBackend: StorageBackend = {
  type: "local" as const,
  name: "test-folder",
  list: vi.fn(() => Promise.resolve([])),
  read: vi.fn(() =>
    Promise.resolve("---\ntitle: My Skill\ndescription: Helps with formatting\ntags:\n  - th-skill\n---\nDo the thing step by step."),
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

describe("load_skill tool", () => {
  let loadSkill: ReturnType<typeof createTools>[number];

  beforeEach(() => {
    storageBackend.value = mockBackend;
    const tools = createTools();
    loadSkill = tools.find((t) => t.name === "load_skill")!;
  });

  it("returns skill body for valid skill note", async () => {
    const skillNote = makeNote({
      id: "20240322T131856",
      title: "My Skill",
      tags: ["th-skill"],
      properties: { description: "Helps with formatting" },
    });
    setNotes([skillNote]);

    const result = await loadSkill.execute("call-1", { noteId: "20240322T131856" });
    const text = result.content[0];
    expect(text.type).toBe("text");
    expect((text as { type: "text"; text: string }).text).toContain("# Skill: My Skill");
    expect((text as { type: "text"; text: string }).text).toContain("Do the thing step by step.");
  });

  it("rejects notes without th-skill tag", async () => {
    const regularNote = makeNote({
      id: "20240322T131856",
      title: "Regular Note",
      tags: ["work"],
    });
    setNotes([regularNote]);

    const result = await loadSkill.execute("call-2", { noteId: "20240322T131856" });
    const text = result.content[0];
    expect((text as { type: "text"; text: string }).text).toContain("not a skill");
    expect(result.details).toHaveProperty("isError", true);
  });

  it("returns error for nonexistent note ID", async () => {
    setNotes([]);

    const result = await loadSkill.execute("call-3", { noteId: "nonexistent" });
    const text = result.content[0];
    expect((text as { type: "text"; text: string }).text).toContain("not found");
    expect(result.details).toHaveProperty("isError", true);
  });
});
