import { describe, it, expect, beforeEach } from "vitest";
import { setNotes } from "../notes/note-store.ts";
import { storageBackend, selectedNoteId } from "../lib/app-state.ts";
import type { Note } from "../notes/note.ts";
import { buildSystemPrompt } from "./system-prompt.ts";

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    properties: {},
    filename: `${overrides.id}--test-note.md`,
    lastModified: Date.now(),
    size: 100,
    isNotiFormat: true,
    createdAt: new Date("2024-03-22T13:18:56"),
    ...overrides,
  };
}

describe("buildSystemPrompt skills", () => {
  beforeEach(() => {
    storageBackend.value = null;
    selectedNoteId.value = null;
    setNotes([]);
  });

  it("includes skill descriptions when skill notes exist", async () => {
    const skillNote = makeNote({
      id: "20240322T131856",
      title: "Code Formatter",
      tags: ["noti-skill"],
      properties: { description: "Formats code blocks in notes" },
    });
    setNotes([skillNote]);

    const prompt = await buildSystemPrompt();
    expect(prompt).toContain("## Available Skills");
    expect(prompt).toContain("**Code Formatter** (ID: 20240322T131856): Formats code blocks in notes");
    expect(prompt).toContain("load_skill");
  });

  it("omits skills section when no skill notes exist", async () => {
    const regularNote = makeNote({
      id: "20240322T131856",
      title: "Regular Note",
      tags: ["work"],
    });
    setNotes([regularNote]);

    const prompt = await buildSystemPrompt();
    expect(prompt).not.toContain("## Available Skills");
  });

  it("skips skills without description property", async () => {
    const skillWithDesc = makeNote({
      id: "20240101T000000",
      title: "With Desc",
      tags: ["noti-skill"],
      properties: { description: "Has a description" },
    });
    const skillWithoutDesc = makeNote({
      id: "20240101T000001",
      title: "No Desc",
      tags: ["noti-skill"],
      properties: {},
    });
    setNotes([skillWithDesc, skillWithoutDesc]);

    const prompt = await buildSystemPrompt();
    expect(prompt).toContain("**With Desc**");
    expect(prompt).not.toContain("**No Desc**");
  });
});
