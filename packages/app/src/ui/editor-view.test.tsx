import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { selectedNoteId, storageBackend, pendingTitleSelect } from "../lib/app-state.ts";
import { notesMap } from "../notes/note-store.ts";
import { EditorView } from "./editor-view.tsx";
import { createEditor } from "../editor/tiptap-editor.ts";
import type { Note } from "@thought-haus/core";
import type { StorageBackend } from "@thought-haus/core";

const mockFocus = vi.fn();
const mockEditor = {
  commands: { focus: mockFocus },
  chain: () => ({
    focus: () => ({
      insertContentAt: () => ({ run: vi.fn() }),
      run: vi.fn(),
    }),
  }),
  getMarkdown: vi.fn(() => ""),
  getText: vi.fn(() => ""),
  destroy: vi.fn(),
  state: { selection: { from: 0 } },
};

vi.mock("../editor/tiptap-editor.ts", () => ({
  createEditor: vi.fn(() => mockEditor),
}));

vi.mock("../notes/note-actions.ts", () => ({
  renameNote: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../search/search-engine.ts", () => ({
  addToIndex: vi.fn(),
  removeFromIndex: vi.fn(),
  updateInIndex: vi.fn(),
}));

vi.mock("../attachments/attachment-service.ts", () => ({
  saveAttachment: vi.fn(),
}));

const mockBackend: StorageBackend = {
  type: "local" as const,
  name: "test-folder",
  list: vi.fn(() => Promise.resolve([])),
  read: vi.fn(() => Promise.resolve("---\ntitle: Test Note\ntags: []\n---\n\n")),
  write: vi.fn(() => Promise.resolve({ lastModified: Date.now(), size: 100 })),
  delete: vi.fn(() => Promise.resolve()),
  getMetadata: vi.fn(() => Promise.resolve({ lastModified: Date.now(), size: 100 })),
  writeBinary: vi.fn(() => Promise.resolve()),
  readBinaryURL: vi.fn(() => Promise.resolve("blob:test")),
  listDir: vi.fn(() => Promise.resolve([])),
  deleteDir: vi.fn(() => Promise.resolve()),
  readFromDir: vi.fn(() => Promise.reject(new Error("not found"))),
  writeToDir: vi.fn(() => Promise.resolve()),
  disconnect: vi.fn(),
};

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

describe("EditorView", () => {
  beforeEach(() => {
    mockFocus.mockClear();
    (mockEditor.destroy as ReturnType<typeof vi.fn>).mockClear();
    vi.mocked(createEditor).mockClear();
    storageBackend.value = mockBackend;
    notesMap.value = new Map();
    selectedNoteId.value = null;
    pendingTitleSelect.value = false;
  });

  afterEach(() => {
    selectedNoteId.value = null;
    storageBackend.value = null;
    notesMap.value = new Map();
  });

  async function renderWithNote(note: Note) {
    notesMap.value = new Map([[note.id, note]]);
    selectedNoteId.value = note.id;
    render(<EditorView />);
    // Wait for async editor initialization (backend.read + createEditor)
    await waitFor(() => {
      expect(vi.mocked(createEditor)).toHaveBeenCalled();
    });
  }

  describe("Enter key in title input", () => {
    it("focuses the editor body when Enter is pressed in the title", async () => {
      await renderWithNote(makeNote({ id: "note-1", title: "Test Note" }));

      const titleInput = screen.getByLabelText("Note title");
      fireEvent.keyDown(titleInput, { key: "Enter" });

      // Allow the setTimeout(0) in the Enter handler to execute
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFocus).toHaveBeenCalled();
    });

    it("does not focus the editor when Escape is pressed in the title", async () => {
      await renderWithNote(makeNote({ id: "note-1", title: "Test Note" }));

      const titleInput = screen.getByLabelText("Note title");
      fireEvent.keyDown(titleInput, { key: "Escape" });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFocus).not.toHaveBeenCalled();
    });

    it("does not focus the editor when Tab is pressed in the title", async () => {
      await renderWithNote(makeNote({ id: "note-1", title: "Test Note" }));

      const titleInput = screen.getByLabelText("Note title");
      fireEvent.keyDown(titleInput, { key: "Tab" });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFocus).not.toHaveBeenCalled();
    });

    it("focuses the editor exactly once per Enter press", async () => {
      await renderWithNote(makeNote({ id: "note-1", title: "Test Note" }));

      const titleInput = screen.getByLabelText("Note title");
      fireEvent.keyDown(titleInput, { key: "Enter" });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFocus).toHaveBeenCalledTimes(1);
    });
  });
});
