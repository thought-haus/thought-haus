import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import {
  notesMap,
  setNotes,
  activeTagFilter,
} from "../notes/note-store.ts";
import type { Note } from "../notes/note.ts";
import { Sidebar } from "./sidebar.tsx";

function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return {
    title: "Test Note",
    tags: [],
    filename: `${overrides.id}.md`,
    fileHandle: {} as FileSystemFileHandle,
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
    expect(screen.getByText("All Notes (2)")).toBeInTheDocument();
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

  it("clears tag filter when All Notes is clicked", () => {
    activeTagFilter.value = "work";
    setNotes([makeNote({ id: "1", tags: ["work"] })]);
    render(
      <Sidebar
        selectedNoteId={null}
        onSelectNote={() => {}}
        onNewNote={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/All Notes/));
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
});
