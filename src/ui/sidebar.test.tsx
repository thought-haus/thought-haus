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
import { Sidebar } from "./sidebar.tsx";

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    filename: `${overrides.id}.md`,
    lastModified: Date.now(),
    size: 100,
    isNotiFormat: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("Sidebar", () => {
  beforeEach(() => {
    notesMap.value = new Map();
    activeTagFilter.value = null;
    searchQuery.value = "";
    searchResults.value = [];
    isSearchActive.value = false;
  });

  it("shows empty state when no notes", () => {
    render(
      <Sidebar
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
      <Sidebar
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
      <Sidebar
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
      <Sidebar
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    expect(screen.getByText("work")).toBeInTheDocument();
    expect(screen.getByText("project")).toBeInTheDocument();
  });

  it("shows tag filter section with counts", () => {
    setNotes([
      makeNote({ id: "1", tags: ["work"] }),
      makeNote({ id: "2", tags: ["work", "personal"] }),
    ]);
    render(
      <Sidebar
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    expect(screen.getByText("work (2)")).toBeInTheDocument();
    expect(screen.getByText("personal (1)")).toBeInTheDocument();
  });

  it("calls onSelectNote when a note is clicked", () => {
    const onSelectNote = vi.fn();
    setNotes([makeNote({ id: "note-1", title: "Clickable Note" })]);
    render(
      <Sidebar
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
      <Sidebar
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
      <Sidebar
        selectedNoteId="1"
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    // The selected note button should have the selected CSS class
    const buttons = container.querySelectorAll("button");
    const selectedBtn = Array.from(buttons).find(
      (b) => b.textContent?.includes("Selected Note"),
    );
    expect(selectedBtn?.className).toContain("noteItemSelected");
  });

  it("filters notes when a tag is clicked", () => {
    setNotes([
      makeNote({ id: "1", title: "Work Note", tags: ["work"] }),
      makeNote({ id: "2", title: "Personal Note", tags: ["personal"] }),
    ]);
    render(
      <Sidebar
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );

    // Both notes visible initially
    expect(screen.getByText("Work Note")).toBeInTheDocument();
    expect(screen.getByText("Personal Note")).toBeInTheDocument();

    // Click work tag filter
    fireEvent.click(screen.getByText("work (1)"));
    expect(activeTagFilter.value).toBe("work");
  });

  it("clears tag filter when active tag label is clicked", () => {
    activeTagFilter.value = "work";
    setNotes([makeNote({ id: "1", tags: ["work"] })]);
    render(
      <Sidebar
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    // When a tag is active, the list header shows the tag name as a clickable button
    fireEvent.click(screen.getByTitle("Click to show all notes"));
    expect(activeTagFilter.value).toBeNull();
  });

  it("toggles tag filter off when same tag is clicked again", () => {
    activeTagFilter.value = "work";
    setNotes([makeNote({ id: "1", tags: ["work"] })]);
    render(
      <Sidebar
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("work (1)"));
    expect(activeTagFilter.value).toBeNull();
  });

  describe("search keyboard navigation", () => {
    function setupSearch() {
      setNotes([
        makeNote({ id: "note-a", title: "Alpha" }),
        makeNote({ id: "note-b", title: "Beta" }),
        makeNote({ id: "note-c", title: "Charlie" }),
      ]);
      // Simulate active search with results
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
        <Sidebar
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
        <Sidebar
          selectedNoteId={null}
          onSelectNote={() => {}}
          onNewNote={() => {}}
        />,
      );
      const input = screen.getByLabelText("Search notes");
      // ArrowDown twice then ArrowUp once → should be on first item
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
        <Sidebar
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
        <Sidebar
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
        <Sidebar
          selectedNoteId={null}
          onSelectNote={() => {}}
          onNewNote={() => {}}
        />,
      );
      const input = screen.getByLabelText("Search notes");
      // Go down 3 times (past last) → wraps to first
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
