import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import {
  appView,
  isBrowserCompatible,
  savedHandle,
  folderName,
} from "../lib/app-state.ts";
import { notesMap } from "../notes/note-store.ts";
import { App } from "./app.tsx";

vi.mock("../lib/browser.ts", () => ({
  isFileSystemAccessSupported: () => true,
}));

const mockDirHandle = {
  name: "my-notes",
  kind: "directory",
  entries: vi.fn(() => ({
    [Symbol.asyncIterator]: () => ({
      next: () => Promise.resolve({ done: true }),
    }),
  })),
} as unknown as FileSystemDirectoryHandle;

vi.mock("../fs/directory.ts", () => ({
  pickDirectory: () => Promise.resolve(mockDirHandle),
  saveDirectoryHandle: () => Promise.resolve(),
  loadDirectoryHandle: () => Promise.resolve(null),
  checkPermission: () => Promise.resolve(false),
  requestPermission: () => Promise.resolve(true),
}));

vi.mock("../storage/scan.ts", () => ({
  scanNotes: () => Promise.resolve([]),
}));

vi.mock("../storage/local-backend.ts", () => {
  function MockLocalBackend(this: Record<string, unknown>, handle: { name: string }) {
    this.type = "local";
    this.name = handle.name;
    this.list = () => Promise.resolve([]);
    this.read = () => Promise.resolve("");
    this.write = () => Promise.resolve({ lastModified: Date.now(), size: 0 });
    this.delete = () => Promise.resolve();
    this.getMetadata = () => Promise.resolve({ lastModified: Date.now(), size: 0 });
    this.disconnect = () => {};
    this.getRawHandle = () => handle;
  }
  return { LocalBackend: MockLocalBackend };
});

vi.mock("../storage/file-watcher.ts", () => ({
  startWatcher: () => () => {},
}));

vi.mock("../search/search-engine.ts", async () => {
  const { signal } = await import("@preact/signals");
  return {
    buildIndex: vi.fn(),
    serializeIndex: () => "{}",
    executeSearch: vi.fn(),
    clearSearch: vi.fn(),
    searchQuery: signal(""),
    searchResults: signal([]),
    isSearchActive: signal(false),
  };
});

vi.mock("../search/search-persistence.ts", () => ({
  saveSearchIndex: () => Promise.resolve(),
}));

describe("App", () => {
  beforeEach(() => {
    appView.value = "onboarding";
    isBrowserCompatible.value = true;
    savedHandle.value = null;
    folderName.value = null;
    notesMap.value = new Map();
  });

  it("shows onboarding by default", () => {
    render(<App />);
    expect(screen.getByText("Noti")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open a Folder" }),
    ).toBeInTheDocument();
  });

  it("shows main layout when view is main", () => {
    appView.value = "main";
    render(<App />);
    expect(screen.getByPlaceholderText("Search notes... (Cmd+K)")).toBeInTheDocument();
    expect(
      screen.getByText("Select a note or create a new one"),
    ).toBeInTheDocument();
  });

  it("shows browser check when browser is incompatible", () => {
    isBrowserCompatible.value = false;
    render(<App />);
    expect(screen.getByText("Browser Not Supported")).toBeInTheDocument();
  });

  it("transitions from onboarding to main on Open a Folder click", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open a Folder" }));
    await waitFor(() => {
      expect(appView.value).toBe("main");
    });
  });

  it("shows re-permission view when saved handle needs permission", () => {
    appView.value = "re-permission";
    folderName.value = "my-notes";
    savedHandle.value = mockDirHandle;
    render(<App />);
    expect(screen.getByText("Welcome Back")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Re-open my-notes" }),
    ).toBeInTheDocument();
  });

  it("re-permission view has option to choose different folder", () => {
    appView.value = "re-permission";
    folderName.value = "my-notes";
    savedHandle.value = mockDirHandle;
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Or choose a different folder" }),
    ).toBeInTheDocument();
  });
});
