import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/preact";
import { selectedNoteId, directoryHandle } from "../lib/app-state.ts";
import { notesMap } from "../notes/note-store.ts";
import { Layout } from "./layout.tsx";

vi.mock("../fs/file-ops.ts", () => ({
  readNoteContent: () => Promise.resolve("---\ntitle: Test\ntags:\n---\nBody"),
  writeFile: () => Promise.resolve(),
  scanDirectory: () => Promise.resolve([]),
}));

vi.mock("../fs/directory.ts", () => ({
  pickDirectory: () => Promise.resolve(null),
  saveDirectoryHandle: () => Promise.resolve(),
  loadDirectoryHandle: () => Promise.resolve(null),
  checkPermission: () => Promise.resolve(false),
}));

describe("Layout", () => {
  beforeEach(() => {
    selectedNoteId.value = null;
    notesMap.value = new Map();
    directoryHandle.value = null;
  });

  it("renders the sidebar with search bar", () => {
    render(<Layout />);
    expect(screen.getByPlaceholderText("Search notes...")).toBeInTheDocument();
  });

  it("renders the editor placeholder when no note selected", () => {
    render(<Layout />);
    expect(
      screen.getByText("Select a note or create a new one"),
    ).toBeInTheDocument();
  });

  it("renders the note list area", () => {
    render(<Layout />);
    expect(screen.getByLabelText("Note list")).toBeInTheDocument();
  });

  it("renders the new note button", () => {
    render(<Layout />);
    expect(screen.getByLabelText("New note")).toBeInTheDocument();
  });
});
