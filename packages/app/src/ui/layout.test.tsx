import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { selectedNoteId, storageBackend, sidebarCollapsed } from "../lib/app-state.ts";
import { notesMap } from "../notes/note-store.ts";
import { Layout } from "./layout.tsx";

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
    storageBackend.value = null;
    sidebarCollapsed.value = false;
  });

  it("renders the sidebar with search bar", () => {
    render(<Layout />);
    expect(screen.getByLabelText("Search notes")).toBeInTheDocument();
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
    expect(screen.queryByLabelText("Search notes")).not.toBeInTheDocument();
  });

  it("shows sidebar when sidebarCollapsed is false", () => {
    sidebarCollapsed.value = false;
    render(<Layout />);
    expect(screen.getByLabelText("Search notes")).toBeInTheDocument();
  });

  it("toggles sidebar with Cmd+\\", () => {
    render(<Layout />);
    expect(screen.getByLabelText("Search notes")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "\\", metaKey: true });
    expect(sidebarCollapsed.value).toBe(true);

    fireEvent.keyDown(window, { key: "\\", metaKey: true });
    expect(sidebarCollapsed.value).toBe(false);
  });
});
