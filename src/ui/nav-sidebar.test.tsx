import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import {
  notesMap,
  setNotes,
  activeTagFilter,
} from "../notes/note-store.ts";
import { favoriteIds } from "../favorites/favorite-store.ts";
import type { Note } from "../notes/note.ts";
import { NavSidebar } from "./nav-sidebar.tsx";

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    properties: {},
    filename: `${overrides.id}.md`,
    lastModified: Date.now(),
    size: 100,
    isNotiFormat: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("NavSidebar", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    activeTagFilter.value = null;
    favoriteIds.value = [];
  });

  it("shows All Notes menu item with count", () => {
    setNotes([
      makeNote({ id: "1", title: "First" }),
      makeNote({ id: "2", title: "Second" }),
    ]);
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={() => {}} />,
    );
    expect(screen.getByText("All Notes")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows tag items with counts", () => {
    setNotes([
      makeNote({ id: "1", tags: ["work"] }),
      makeNote({ id: "2", tags: ["work", "personal"] }),
    ]);
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={() => {}} />,
    );
    expect(screen.getByText("work")).toBeInTheDocument();
    expect(screen.getByText("personal")).toBeInTheDocument();
  });

  it("sets active tag filter when tag is clicked", () => {
    setNotes([
      makeNote({ id: "1", tags: ["work"] }),
    ]);
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={() => {}} />,
    );
    fireEvent.click(screen.getByText("work"));
    expect(activeTagFilter.value).toBe("work");
  });

  it("clears active tag filter when All Notes is clicked", () => {
    activeTagFilter.value = "work";
    setNotes([makeNote({ id: "1", tags: ["work"] })]);
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={() => {}} />,
    );
    fireEvent.click(screen.getByText("All Notes"));
    expect(activeTagFilter.value).toBeNull();
  });

  it("toggles tag filter off when same tag is clicked again", () => {
    activeTagFilter.value = "work";
    setNotes([makeNote({ id: "1", tags: ["work"] })]);
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={() => {}} />,
    );
    fireEvent.click(screen.getByText("work"));
    expect(activeTagFilter.value).toBeNull();
  });

  it("shows favorites section when favorites exist", () => {
    setNotes([makeNote({ id: "note-1", title: "My Favorite" })]);
    favoriteIds.value = ["note-1"];
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={() => {}} />,
    );
    expect(screen.getByText("Favorites")).toBeInTheDocument();
    expect(screen.getByText("My Favorite")).toBeInTheDocument();
  });

  it("calls onSelectNote when a favorite is clicked", () => {
    const onSelectNote = vi.fn();
    setNotes([makeNote({ id: "note-1", title: "My Favorite" })]);
    favoriteIds.value = ["note-1"];
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={onSelectNote} />,
    );
    fireEvent.click(screen.getByText("My Favorite"));
    expect(onSelectNote).toHaveBeenCalledWith("note-1");
  });
});
