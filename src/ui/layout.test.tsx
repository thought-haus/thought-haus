import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { selectedNoteId, directoryHandle, sidebarCollapsed } from "../lib/app-state.ts";
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
    sidebarCollapsed.value = false;
  });

  it("renders the sidebar with search bar", () => {
    render(<Layout />);
    expect(screen.getByPlaceholderText("Search notes... (Cmd+K)")).toBeInTheDocument();
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

  it("hides sidebar when sidebarCollapsed is true", () => {
    sidebarCollapsed.value = true;
    render(<Layout />);
    expect(screen.queryByPlaceholderText("Search notes... (Cmd+K)")).not.toBeInTheDocument();
  });

  it("shows sidebar when sidebarCollapsed is false", () => {
    sidebarCollapsed.value = false;
    render(<Layout />);
    expect(screen.getByPlaceholderText("Search notes... (Cmd+K)")).toBeInTheDocument();
  });

  it("toggles sidebar with Cmd+\\", () => {
    render(<Layout />);
    expect(screen.getByPlaceholderText("Search notes... (Cmd+K)")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "\\", metaKey: true });
    expect(sidebarCollapsed.value).toBe(true);

    fireEvent.keyDown(window, { key: "\\", metaKey: true });
    expect(sidebarCollapsed.value).toBe(false);
  });
});
