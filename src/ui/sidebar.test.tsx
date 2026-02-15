import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import {
  notesMap,
  setNotes,
  activeTagFilter,
} from "../notes/note-store.ts";
import {
  searchQuery,
  searchResults,
  isSearchActive,
} from "../search/search-engine.ts";
import type { Note } from "../notes/note.ts";
import { NotesList } from "./sidebar.tsx";

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

describe("NotesList", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    activeTagFilter.value = null;
    searchQuery.value = "";
    searchResults.value = [];
    isSearchActive.value = false;
  });

  it("shows empty state when no notes", () => {
    render(
      <NotesList
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    expect(screen.getByText("No notes yet")).toBeInTheDocument();
  });

  it("shows note count in All Notes header", () => {
    setNotes([
      makeNote({ id: "1", title: "First" }),
      makeNote({ id: "2", title: "Second" }),
    ]);
    render(
      <NotesList
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    expect(screen.getByText(/All Notes/)).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("renders note titles in the list", () => {
    setNotes([makeNote({ id: "1", title: "My First Note" })]);
    render(
      <NotesList
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    expect(screen.getByText("My First Note")).toBeInTheDocument();
  });

  it("renders tag pills on notes", () => {
    setNotes([makeNote({ id: "1", tags: ["work", "project"] })]);
    render(
      <NotesList
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    expect(screen.getByText("work")).toBeInTheDocument();
    expect(screen.getByText("project")).toBeInTheDocument();
  });

  it("calls onSelectNote when a note is clicked", () => {
    const onSelectNote = vi.fn();
    setNotes([makeNote({ id: "note-1", title: "Clickable Note" })]);
    render(
      <NotesList
        selectedNoteId={null}
        onSelectNote={onSelectNote}
        onNewNote={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("Clickable Note"));
    expect(onSelectNote).toHaveBeenCalledWith("note-1");
  });

  it("calls onNewNote when + button is clicked", () => {
    const onNewNote = vi.fn();
    render(
      <NotesList
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={onNewNote}
      />,
    );
    fireEvent.click(screen.getByLabelText("New note"));
    expect(onNewNote).toHaveBeenCalledOnce();
  });

  it("highlights the selected note", () => {
    setNotes([
      makeNote({ id: "1", title: "Selected Note" }),
      makeNote({ id: "2", title: "Other Note" }),
    ]);
    const { container } = render(
      <NotesList
        selectedNoteId="1"
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    const buttons = container.querySelectorAll("button");
    const selectedBtn = Array.from(buttons).find(
      (b) => b.textContent?.includes("Selected Note"),
    );
    expect(selectedBtn?.className).toContain("noteItemSelected");
  });

  it("clears tag filter when active tag label is clicked", () => {
    activeTagFilter.value = "work";
    setNotes([makeNote({ id: "1", tags: ["work"] })]);
    render(
      <NotesList
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    fireEvent.click(screen.getByTitle("Click to show all notes"));
    expect(activeTagFilter.value).toBeNull();
  });

  describe("search keyboard navigation", () => {
    function setupSearch() {
      setNotes([
        makeNote({ id: "note-a", title: "Alpha" }),
        makeNote({ id: "note-b", title: "Beta" }),
        makeNote({ id: "note-c", title: "Charlie" }),
      ]);
      searchQuery.value = "test";
      searchResults.value = [
        { id: "note-a", title: "Alpha", score: 3 },
        { id: "note-b", title: "Beta", score: 2 },
        { id: "note-c", title: "Charlie", score: 1 },
      ];
      isSearchActive.value = true;
    }

    it("highlights next result on ArrowDown", () => {
      setupSearch();
      const { container } = render(
        <NotesList
          selectedNoteId={null}
          onSelectNote={() => {}}
          onNewNote={() => {}}
        />,
      );
      const input = screen.getByLabelText("Search notes");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      const buttons = container.querySelectorAll("button");
      const highlighted = Array.from(buttons).find((b) =>
        b.className.includes("noteItemSelected"),
      );
      expect(highlighted?.textContent).toContain("Alpha");
    });

    it("highlights previous result on ArrowUp", () => {
      setupSearch();
      const { container } = render(
        <NotesList
          selectedNoteId={null}
          onSelectNote={() => {}}
          onNewNote={() => {}}
        />,
      );
      const input = screen.getByLabelText("Search notes");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowUp" });
      const buttons = container.querySelectorAll("button");
      const highlighted = Array.from(buttons).find((b) =>
        b.className.includes("noteItemSelected"),
      );
      expect(highlighted?.textContent).toContain("Alpha");
    });

    it("navigates with Ctrl+N and Ctrl+P", () => {
      setupSearch();
      const { container } = render(
        <NotesList
          selectedNoteId={null}
          onSelectNote={() => {}}
          onNewNote={() => {}}
        />,
      );
      const input = screen.getByLabelText("Search notes");
      fireEvent.keyDown(input, { key: "n", ctrlKey: true });
      fireEvent.keyDown(input, { key: "n", ctrlKey: true });
      const buttons = container.querySelectorAll("button");
      const highlighted = Array.from(buttons).find((b) =>
        b.className.includes("noteItemSelected"),
      );
      expect(highlighted?.textContent).toContain("Beta");

      fireEvent.keyDown(input, { key: "p", ctrlKey: true });
      const buttons2 = container.querySelectorAll("button");
      const highlighted2 = Array.from(buttons2).find((b) =>
        b.className.includes("noteItemSelected"),
      );
      expect(highlighted2?.textContent).toContain("Alpha");
    });

    it("selects highlighted result on Enter", () => {
      setupSearch();
      const onSelectNote = vi.fn();
      render(
        <NotesList
          selectedNoteId={null}
          onSelectNote={onSelectNote}
          onNewNote={() => {}}
        />,
      );
      const input = screen.getByLabelText("Search notes");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onSelectNote).toHaveBeenCalledWith("note-a");
    });

    it("wraps around from bottom to top", () => {
      setupSearch();
      const { container } = render(
        <NotesList
          selectedNoteId={null}
          onSelectNote={() => {}}
          onNewNote={() => {}}
        />,
      );
      const input = screen.getByLabelText("Search notes");
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "ArrowDown" });
      const buttons = container.querySelectorAll("button");
      const highlighted = Array.from(buttons).find((b) =>
        b.className.includes("noteItemSelected"),
      );
      expect(highlighted?.textContent).toContain("Alpha");
    });
  });
});
