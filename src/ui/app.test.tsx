import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import {
  appView,
  savedHandle,
  savedWebDavConfig,
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
    addToIndex: vi.fn(),
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

vi.mock("../storage/backend-persistence.ts", () => ({
  saveWebDavConfig: vi.fn(() => Promise.resolve()),
  loadWebDavConfig: vi.fn(() => Promise.resolve(null)),
  saveActiveBackendType: vi.fn(() => Promise.resolve()),
  loadActiveBackendType: vi.fn(() => Promise.resolve(null)),
  clearBackendConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock("../storage/webdav-connection.ts", () => ({
  testWebDavConnection: vi.fn(() => Promise.resolve({ ok: false, error: "cors" })),
}));

vi.mock("../storage/webdav-backend.ts", () => {
  function MockWebDavBackend(this: Record<string, unknown>, config: { url: string }) {
    this.type = "webdav";
    this.name = "test-server";
    this.list = () => Promise.resolve([]);
    this.read = () => Promise.resolve("");
    this.write = () => Promise.resolve({ lastModified: Date.now(), size: 0 });
    this.delete = () => Promise.resolve();
    this.getMetadata = () => Promise.resolve({ lastModified: Date.now(), size: 0 });
    this.disconnect = vi.fn();
    this.baseUrl = config.url;
  }
  return { WebDavBackend: MockWebDavBackend };
});

describe("App", () => {
  beforeEach(() => {
    appView.value = "onboarding";
    savedHandle.value = null;
    savedWebDavConfig.value = null;
    folderName.value = null;
    notesMap.value = new Map();
  });

  it("shows onboarding by default", () => {
    render(<App />);
    expect(screen.getByText("Thought.Haus")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open a Folder" }),
    ).toBeInTheDocument();
  });

  it("shows main layout when view is main", () => {
    appView.value = "main";
    render(<App />);
    expect(screen.getByLabelText("Search notes")).toBeInTheDocument();
    expect(
      screen.getByText("Select a note or create a new one"),
    ).toBeInTheDocument();
  });

  it("shows Local Folder and WebDAV tabs in onboarding", () => {
    render(<App />);
    expect(screen.getByText("Local Folder")).toBeInTheDocument();
    expect(screen.getByText("WebDAV Server")).toBeInTheDocument();
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

  describe("WebDAV reconnect view", () => {
    it("shows WebDAV reconnect view with server URL", () => {
      appView.value = "webdav-reconnect";
      savedWebDavConfig.value = {
        url: "http://myserver:8080/webdav/",
        username: "noti",
        password: "notidev",
      };
      render(<App />);
      expect(screen.getByRole("heading", { name: "Reconnect" })).toBeInTheDocument();
      expect(screen.getByText("http://myserver:8080/webdav/")).toBeInTheDocument();
    });

    it("shows Change server button in reconnect view", () => {
      appView.value = "webdav-reconnect";
      savedWebDavConfig.value = {
        url: "http://myserver:8080/webdav/",
        username: "noti",
        password: "notidev",
      };
      render(<App />);
      expect(screen.getByText("Change server")).toBeInTheDocument();
    });

    it("Change server goes to onboarding", () => {
      appView.value = "webdav-reconnect";
      savedWebDavConfig.value = {
        url: "http://myserver:8080/webdav/",
        username: "noti",
        password: "notidev",
      };
      render(<App />);
      fireEvent.click(screen.getByText("Change server"));
      expect(appView.value).toBe("onboarding");
      expect(savedWebDavConfig.value).toBeNull();
    });
  });
});
