import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import {
  notesMap,
  setNotes,
  activeTagFilter,
} from "../notes/note-store.ts";
import { favoriteIds } from "../favorites/favorite-store.ts";
import { recentlyViewedIds } from "../recently-viewed/recently-viewed-store.ts";
import type { Note } from "@thought-haus/core";
import { NavSidebar } from "./nav-sidebar.tsx";

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    properties: {},
    filename: `${overrides.id}.md`,
    lastModified: Date.now(),
    size: 100,
    isTimestampFormat: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("NavSidebar", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    activeTagFilter.value = null;
    favoriteIds.value = [];
    recentlyViewedIds.value = [];
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



  it("renders Favorites section above Tags", () => {
    setNotes([
      makeNote({ id: "1", tags: ["work"], title: "Tagged Note" }),
      makeNote({ id: "2", title: "My Favorite" }),
    ]);
    favoriteIds.value = ["2"];
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={() => {}} />,
    );

    const favoritesHeader = screen.getByText("Favorites");
    const tagsHeader = screen.getByText("Tags");
    const favoritesPosition = favoritesHeader.compareDocumentPosition(tagsHeader);

    expect(favoritesPosition & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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


  it("shows recently viewed section when recently viewed notes exist", () => {
    setNotes([
      makeNote({ id: "note-1", title: "Recent Note" }),
    ]);
    recentlyViewedIds.value = ["note-1"];
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={() => {}} />,
    );

    expect(screen.getByText("Recently Viewed")).toBeInTheDocument();
    expect(screen.getByText("Recent Note")).toBeInTheDocument();
  });

  it("calls onSelectNote when a recently viewed note is clicked", () => {
    const onSelectNote = vi.fn();
    setNotes([makeNote({ id: "note-1", title: "Recent Note" })]);
    recentlyViewedIds.value = ["note-1"];
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={onSelectNote} />,
    );

    fireEvent.click(screen.getByText("Recent Note"));
    expect(onSelectNote).toHaveBeenCalledWith("note-1");
  });
  it("renders Settings button in footer", () => {
    render(
      <NavSidebar selectedNoteId={null} onSelectNote={() => {}} />,
    );
    expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
  });
});
