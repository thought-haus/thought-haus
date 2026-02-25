import { describe, it, expect, beforeEach } from "vitest";
import {
  backlinkIndex,
  buildBacklinkIndex,
  updateNoteLinks,
  removeNoteLinks,
  getBacklinks,
  clearBacklinks,
} from "./backlink-index.ts";
import { setNotes, notesMap } from "./note-store.ts";
import type { Note } from "@thought-haus/core";

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

const NOTE_A = "20240101T000000";
const NOTE_B = "20240202T120000";
const NOTE_C = "20240303T180000";

beforeEach(() => {
  clearBacklinks();
  notesMap.value = new Map();
});

describe("buildBacklinkIndex", () => {
  it("builds index from note bodies with links", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
      makeNote({ id: NOTE_C, title: "Note C" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `See [[${NOTE_B}]] for details` },
      { id: NOTE_B, body: `Related to [[${NOTE_C}]]` },
      { id: NOTE_C, body: "No links here" },
    ]);

    // NOTE_B is linked by NOTE_A
    expect(backlinkIndex.value.get(NOTE_B)?.has(NOTE_A)).toBe(true);
    // NOTE_C is linked by NOTE_B
    expect(backlinkIndex.value.get(NOTE_C)?.has(NOTE_B)).toBe(true);
    // NOTE_A is not linked by anyone
    expect(backlinkIndex.value.has(NOTE_A)).toBe(false);
  });

  it("handles multiple links in one note", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
      makeNote({ id: NOTE_C, title: "Note C" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `Links to [[${NOTE_B}]] and [[${NOTE_C}]]` },
      { id: NOTE_B, body: "" },
      { id: NOTE_C, body: "" },
    ]);

    expect(backlinkIndex.value.get(NOTE_B)?.has(NOTE_A)).toBe(true);
    expect(backlinkIndex.value.get(NOTE_C)?.has(NOTE_A)).toBe(true);
  });

  it("excludes self-links", () => {
    setNotes([makeNote({ id: NOTE_A, title: "Note A" })]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `Self ref [[${NOTE_A}]]` },
    ]);

    expect(backlinkIndex.value.has(NOTE_A)).toBe(false);
  });

  it("handles circular links", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `See [[${NOTE_B}]]` },
      { id: NOTE_B, body: `See [[${NOTE_A}]]` },
    ]);

    expect(backlinkIndex.value.get(NOTE_A)?.has(NOTE_B)).toBe(true);
    expect(backlinkIndex.value.get(NOTE_B)?.has(NOTE_A)).toBe(true);
  });

  it("handles empty note bodies", () => {
    buildBacklinkIndex([
      { id: NOTE_A, body: "" },
      { id: NOTE_B, body: "" },
    ]);

    expect(backlinkIndex.value.size).toBe(0);
  });
});

describe("updateNoteLinks", () => {
  it("adds new backlinks when a note is saved with links", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: "" },
      { id: NOTE_B, body: "" },
    ]);

    updateNoteLinks(NOTE_A, `Now links to [[${NOTE_B}]]`);

    expect(backlinkIndex.value.get(NOTE_B)?.has(NOTE_A)).toBe(true);
  });

  it("removes backlinks when a link is removed from a note", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `Link to [[${NOTE_B}]]` },
      { id: NOTE_B, body: "" },
    ]);

    expect(backlinkIndex.value.get(NOTE_B)?.has(NOTE_A)).toBe(true);

    // Save NOTE_A without the link
    updateNoteLinks(NOTE_A, "No more links");

    expect(backlinkIndex.value.has(NOTE_B)).toBe(false);
  });

  it("handles link target changes", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
      makeNote({ id: NOTE_C, title: "Note C" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `Link to [[${NOTE_B}]]` },
      { id: NOTE_B, body: "" },
      { id: NOTE_C, body: "" },
    ]);

    // Change link from B to C
    updateNoteLinks(NOTE_A, `Now links to [[${NOTE_C}]]`);

    expect(backlinkIndex.value.has(NOTE_B)).toBe(false);
    expect(backlinkIndex.value.get(NOTE_C)?.has(NOTE_A)).toBe(true);
  });

  it("does not update signal when no changes occur", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `Link to [[${NOTE_B}]]` },
      { id: NOTE_B, body: "" },
    ]);

    const prevIndex = backlinkIndex.value;
    updateNoteLinks(NOTE_A, `Still links to [[${NOTE_B}]]`);

    // Signal value should be the same reference (no update)
    expect(backlinkIndex.value).toBe(prevIndex);
  });

  it("skips self-links on update", () => {
    setNotes([makeNote({ id: NOTE_A, title: "Note A" })]);

    buildBacklinkIndex([{ id: NOTE_A, body: "" }]);

    updateNoteLinks(NOTE_A, `Self [[${NOTE_A}]]`);

    expect(backlinkIndex.value.has(NOTE_A)).toBe(false);
  });
});

describe("removeNoteLinks", () => {
  it("removes note as source from all targets", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
      makeNote({ id: NOTE_C, title: "Note C" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `[[${NOTE_B}]] and [[${NOTE_C}]]` },
      { id: NOTE_B, body: "" },
      { id: NOTE_C, body: "" },
    ]);

    removeNoteLinks(NOTE_A);

    expect(backlinkIndex.value.has(NOTE_B)).toBe(false);
    expect(backlinkIndex.value.has(NOTE_C)).toBe(false);
  });

  it("removes note as target (backlinks to deleted note)", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `Link to [[${NOTE_B}]]` },
      { id: NOTE_B, body: "" },
    ]);

    // Delete NOTE_B — its backlinks entry should be removed
    removeNoteLinks(NOTE_B);

    expect(backlinkIndex.value.has(NOTE_B)).toBe(false);
  });

  it("preserves other notes' backlinks when one is removed", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
      makeNote({ id: NOTE_C, title: "Note C" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `[[${NOTE_C}]]` },
      { id: NOTE_B, body: `[[${NOTE_C}]]` },
      { id: NOTE_C, body: "" },
    ]);

    // Both A and B link to C
    expect(backlinkIndex.value.get(NOTE_C)?.size).toBe(2);

    // Remove A's links
    removeNoteLinks(NOTE_A);

    // C should still have B as a backlink
    expect(backlinkIndex.value.get(NOTE_C)?.has(NOTE_B)).toBe(true);
    expect(backlinkIndex.value.get(NOTE_C)?.size).toBe(1);
  });

  it("handles removing a note with no links gracefully", () => {
    buildBacklinkIndex([
      { id: NOTE_A, body: "" },
    ]);

    // Should not throw
    removeNoteLinks(NOTE_A);
    expect(backlinkIndex.value.size).toBe(0);
  });
});

describe("getBacklinks", () => {
  it("returns notes linking to the given ID", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A", createdAt: new Date("2024-01-01") }),
      makeNote({ id: NOTE_B, title: "Note B", createdAt: new Date("2024-02-01") }),
      makeNote({ id: NOTE_C, title: "Note C" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `[[${NOTE_C}]]` },
      { id: NOTE_B, body: `[[${NOTE_C}]]` },
      { id: NOTE_C, body: "" },
    ]);

    const backlinks = getBacklinks(NOTE_C);
    expect(backlinks).toHaveLength(2);
    expect(backlinks.map((n) => n.id)).toContain(NOTE_A);
    expect(backlinks.map((n) => n.id)).toContain(NOTE_B);
  });

  it("returns empty array for notes with no backlinks", () => {
    setNotes([makeNote({ id: NOTE_A, title: "Note A" })]);
    buildBacklinkIndex([{ id: NOTE_A, body: "" }]);

    expect(getBacklinks(NOTE_A)).toHaveLength(0);
  });

  it("sorts by creation date newest first", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Older", createdAt: new Date("2024-01-01") }),
      makeNote({ id: NOTE_B, title: "Newer", createdAt: new Date("2024-06-01") }),
      makeNote({ id: NOTE_C, title: "Target" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `[[${NOTE_C}]]` },
      { id: NOTE_B, body: `[[${NOTE_C}]]` },
      { id: NOTE_C, body: "" },
    ]);

    const backlinks = getBacklinks(NOTE_C);
    expect(backlinks[0].id).toBe(NOTE_B); // Newer first
    expect(backlinks[1].id).toBe(NOTE_A);
  });

  it("excludes source notes that no longer exist in store", () => {
    setNotes([
      makeNote({ id: NOTE_A, title: "Note A" }),
      makeNote({ id: NOTE_B, title: "Note B" }),
      makeNote({ id: NOTE_C, title: "Note C" }),
    ]);

    buildBacklinkIndex([
      { id: NOTE_A, body: `[[${NOTE_C}]]` },
      { id: NOTE_B, body: `[[${NOTE_C}]]` },
      { id: NOTE_C, body: "" },
    ]);

    // Remove NOTE_A from the store (simulating deletion without cleanup)
    const map = new Map(notesMap.value);
    map.delete(NOTE_A);
    notesMap.value = map;

    const backlinks = getBacklinks(NOTE_C);
    expect(backlinks).toHaveLength(1);
    expect(backlinks[0].id).toBe(NOTE_B);
  });

  it("returns empty array for unknown note ID", () => {
    expect(getBacklinks("nonexistent")).toHaveLength(0);
  });
});

describe("clearBacklinks", () => {
  it("clears the entire index", () => {
    buildBacklinkIndex([
      { id: NOTE_A, body: `[[${NOTE_B}]]` },
      { id: NOTE_B, body: "" },
    ]);

    expect(backlinkIndex.value.size).toBeGreaterThan(0);

    clearBacklinks();

    expect(backlinkIndex.value.size).toBe(0);
  });
});
