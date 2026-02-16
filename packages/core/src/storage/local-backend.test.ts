import { describe, it, expect, vi } from "vitest";
import { LocalBackend } from "./local-backend.ts";

function makeMockFile(
  name: string,
  content: string,
  lastModified = 1000,
): File {
  return {
    name,
    text: () => Promise.resolve(content),
    lastModified,
    size: content.length,
  } as unknown as File;
}

function makeMockWritable() {
  return {
    write: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  };
}

function makeMockFileHandle(name: string, content: string, lastModified = 1000) {
  const writable = makeMockWritable();
  const file = makeMockFile(name, content, lastModified);
  return {
    kind: "file" as const,
    name,
    getFile: vi.fn(() => Promise.resolve(file)),
    createWritable: vi.fn(() => Promise.resolve(writable)),
    _writable: writable,
    _file: file,
  } as unknown as FileSystemFileHandle & {
    _writable: ReturnType<typeof makeMockWritable>;
    _file: File;
  };
}

function makeMockDirHandle(
  entries: Array<[string, { kind: string } & Record<string, unknown>]>,
) {
  return {
    kind: "directory" as const,
    name: "test-dir",
    entries: vi.fn(() => ({
      [Symbol.asyncIterator]: () => {
        let i = 0;
        return {
          next: () => {
            if (i < entries.length) {
              const entry = entries[i++];
              return Promise.resolve({ done: false, value: entry });
            }
            return Promise.resolve({ done: true, value: undefined });
          },
        };
      },
    })),
    getFileHandle: vi.fn(),
    removeEntry: vi.fn(() => Promise.resolve()),
  } as unknown as FileSystemDirectoryHandle & {
    getFileHandle: ReturnType<typeof vi.fn>;
    removeEntry: ReturnType<typeof vi.fn>;
  };
}

describe("LocalBackend", () => {
  describe("constructor", () => {
    it("exposes directory name and type", () => {
      const dir = makeMockDirHandle([]);
      const backend = new LocalBackend(dir);
      expect(backend.name).toBe("test-dir");
      expect(backend.type).toBe("local");
    });

    it("getRawHandle returns the original handle", () => {
      const dir = makeMockDirHandle([]);
      const backend = new LocalBackend(dir);
      expect(backend.getRawHandle()).toBe(dir);
    });
  });

  describe("list", () => {
    it("returns FileEntry objects for files", async () => {
      const fh = makeMockFileHandle("note.md", "content", 5000);
      const dir = makeMockDirHandle([
        ["note.md", fh as unknown as { kind: string }],
      ]);
      const backend = new LocalBackend(dir);

      const entries = await backend.list();

      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual({
        filename: "note.md",
        lastModified: 5000,
        size: 7,
      });
    });

    it("skips directory entries", async () => {
      const fh = makeMockFileHandle("note.md", "content");
      const dirEntry = { kind: "directory", name: "subdir" };
      const dir = makeMockDirHandle([
        ["subdir", dirEntry as { kind: string }],
        ["note.md", fh as unknown as { kind: string }],
      ]);
      const backend = new LocalBackend(dir);

      const entries = await backend.list();

      expect(entries).toHaveLength(1);
      expect(entries[0].filename).toBe("note.md");
    });

    it("returns empty array for empty directory", async () => {
      const dir = makeMockDirHandle([]);
      const backend = new LocalBackend(dir);

      const entries = await backend.list();

      expect(entries).toEqual([]);
    });

    it("populates handle cache for subsequent operations", async () => {
      const fh = makeMockFileHandle("note.md", "Hello");
      const dir = makeMockDirHandle([
        ["note.md", fh as unknown as { kind: string }],
      ]);
      const backend = new LocalBackend(dir);

      await backend.list();
      // read should use cached handle, not call getFileHandle
      const content = await backend.read("note.md");

      expect(content).toBe("Hello");
      expect(dir.getFileHandle).not.toHaveBeenCalled();
    });
  });

  describe("read", () => {
    it("reads file content as text", async () => {
      const fh = makeMockFileHandle("test.md", "Hello World");
      const dir = makeMockDirHandle([]);
      dir.getFileHandle.mockResolvedValue(fh);
      const backend = new LocalBackend(dir);

      const content = await backend.read("test.md");

      expect(content).toBe("Hello World");
    });

    it("uses cached handle on second read", async () => {
      const fh = makeMockFileHandle("test.md", "Hello");
      const dir = makeMockDirHandle([]);
      dir.getFileHandle.mockResolvedValue(fh);
      const backend = new LocalBackend(dir);

      await backend.read("test.md");
      await backend.read("test.md");

      // getFileHandle called only once — second read uses cache
      expect(dir.getFileHandle).toHaveBeenCalledTimes(1);
    });
  });

  describe("write", () => {
    it("writes content via writable stream and returns metadata", async () => {
      const fh = makeMockFileHandle("test.md", "new content", 9999);
      const dir = makeMockDirHandle([]);
      dir.getFileHandle.mockResolvedValue(fh);
      const backend = new LocalBackend(dir);

      const meta = await backend.write("test.md", "new content");

      expect(fh._writable.write).toHaveBeenCalledWith("new content");
      expect(fh._writable.close).toHaveBeenCalled();
      expect(meta.lastModified).toBe(9999);
      expect(meta.size).toBe(11);
    });

    it("creates new file if not in cache", async () => {
      const fh = makeMockFileHandle("new.md", "data");
      const dir = makeMockDirHandle([]);
      dir.getFileHandle.mockResolvedValue(fh);
      const backend = new LocalBackend(dir);

      await backend.write("new.md", "data");

      expect(dir.getFileHandle).toHaveBeenCalledWith("new.md", {
        create: true,
      });
    });

    it("reuses cached handle on subsequent writes", async () => {
      const fh = makeMockFileHandle("test.md", "content");
      const dir = makeMockDirHandle([
        ["test.md", fh as unknown as { kind: string }],
      ]);
      const backend = new LocalBackend(dir);

      // list() populates cache
      await backend.list();
      await backend.write("test.md", "updated");

      // Should not call getFileHandle since it was cached by list()
      expect(dir.getFileHandle).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("calls removeEntry on the directory handle", async () => {
      const dir = makeMockDirHandle([]);
      const backend = new LocalBackend(dir);

      await backend.delete("old.md");

      expect(dir.removeEntry).toHaveBeenCalledWith("old.md");
    });

    it("clears the file from handle cache", async () => {
      const fh = makeMockFileHandle("note.md", "content");
      const dir = makeMockDirHandle([
        ["note.md", fh as unknown as { kind: string }],
      ]);
      const backend = new LocalBackend(dir);

      await backend.list(); // populates cache
      await backend.delete("note.md");

      // Next read should call getFileHandle (cache was cleared)
      const fh2 = makeMockFileHandle("note.md", "new");
      dir.getFileHandle.mockResolvedValue(fh2);
      await backend.read("note.md");
      expect(dir.getFileHandle).toHaveBeenCalledWith("note.md");
    });
  });

  describe("getMetadata", () => {
    it("returns lastModified and size", async () => {
      const fh = makeMockFileHandle("test.md", "12345", 7777);
      const dir = makeMockDirHandle([]);
      dir.getFileHandle.mockResolvedValue(fh);
      const backend = new LocalBackend(dir);

      const meta = await backend.getMetadata("test.md");

      expect(meta).toEqual({ lastModified: 7777, size: 5 });
    });
  });

  describe("disconnect", () => {
    it("clears the handle cache", async () => {
      const fh = makeMockFileHandle("note.md", "content");
      const dir = makeMockDirHandle([
        ["note.md", fh as unknown as { kind: string }],
      ]);
      const backend = new LocalBackend(dir);

      await backend.list(); // populates cache
      backend.disconnect();

      // Next read should call getFileHandle (cache was cleared)
      const fh2 = makeMockFileHandle("note.md", "new");
      dir.getFileHandle.mockResolvedValue(fh2);
      await backend.read("note.md");
      expect(dir.getFileHandle).toHaveBeenCalled();
    });
  });

  describe("onExternalChange", () => {
    it("returns a no-op cleanup when FileSystemObserver is unavailable", () => {
      const dir = makeMockDirHandle([]);
      const backend = new LocalBackend(dir);
      // FileSystemObserver is not defined in jsdom
      const cleanup = backend.onExternalChange(() => {});
      expect(typeof cleanup).toBe("function");
      cleanup(); // should not throw
    });
  });
});
