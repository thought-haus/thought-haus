import { describe, it, expect, beforeEach } from "vitest";
import { parseNoteLinks, resolveNoteLink } from "./note-links.ts";
import { setNotes, notesMap } from "../notes/note-store.ts";
import type { Note } from "../notes/note.ts";

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    filename: `${overrides.id}--test-note.md`,
    fileHandle: {} as FileSystemFileHandle,
    lastModified: Date.now(),
    size: 100,
    isNotiFormat: true,
    createdAt: new Date("2024-03-22T13:18:56"),
    ...overrides,
  };
}

describe("parseNoteLinks", () => {
  it("finds a single note link", () => {
    const links = parseNoteLinks("See [[20240322T131856]] for details");
    expect(links).toHaveLength(1);
    expect(links[0].id).toBe("20240322T131856");
    expect(links[0].start).toBe(4);
    expect(links[0].end).toBe(23);
  });

  it("finds multiple note links", () => {
    const links = parseNoteLinks(
      "Link [[20240101T000000]] and [[20240202T120000]] here",
    );
    expect(links).toHaveLength(2);
    expect(links[0].id).toBe("20240101T000000");
    expect(links[1].id).toBe("20240202T120000");
  });

  it("returns empty array for text without links", () => {
    const links = parseNoteLinks("No links here");
    expect(links).toHaveLength(0);
  });

  it("ignores malformed link patterns", () => {
    expect(parseNoteLinks("[[notadate]]")).toHaveLength(0);
    expect(parseNoteLinks("[[12345678T12345]]")).toHaveLength(0); // Too short
    expect(parseNoteLinks("[[123456789T123456]]")).toHaveLength(0); // Too long
    expect(parseNoteLinks("[20240322T131856]")).toHaveLength(0); // Single brackets
  });

  it("matches exact timestamp format YYYYMMDDTHHMMSS", () => {
    const links = parseNoteLinks("[[20240322T131856]]");
    expect(links).toHaveLength(1);
    expect(links[0].id).toBe("20240322T131856");
  });

  it("finds links at start and end of text", () => {
    const text = "[[20240101T000000]]text[[20240202T120000]]";
    const links = parseNoteLinks(text);
    expect(links).toHaveLength(2);
    expect(links[0].start).toBe(0);
    expect(links[1].end).toBe(text.length);
  });

  it("handles empty string", () => {
    expect(parseNoteLinks("")).toHaveLength(0);
  });
});

describe("resolveNoteLink", () => {
  beforeEach(() => {
    notesMap.value = new Map();
  });

  it("returns note title when note exists", () => {
    setNotes([makeNote({ id: "20240322T131856", title: "Meeting Notes" })]);
    const result = resolveNoteLink("20240322T131856");
    expect(result.title).toBe("Meeting Notes");
    expect(result.exists).toBe(true);
  });

  it("returns ID and exists=false for missing note", () => {
    const result = resolveNoteLink("20240322T131856");
    expect(result.title).toBe("20240322T131856");
    expect(result.exists).toBe(false);
  });

  it("resolves different notes correctly", () => {
    setNotes([
      makeNote({ id: "20240101T000000", title: "First Note" }),
      makeNote({ id: "20240202T120000", title: "Second Note" }),
    ]);
    expect(resolveNoteLink("20240101T000000").title).toBe("First Note");
    expect(resolveNoteLink("20240202T120000").title).toBe("Second Note");
    expect(resolveNoteLink("20240303T000000").exists).toBe(false);
  });
});
