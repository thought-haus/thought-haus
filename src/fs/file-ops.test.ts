import { describe, it, expect, vi } from "vitest";
import { scanDirectory, readNoteContent, writeFile } from "./file-ops.ts";

function makeMockFile(
  name: string,
  content: string,
  lastModified = Date.now(),
): File {
  return {
    name,
    text: () => Promise.resolve(content),
    lastModified,
    size: content.length,
  } as unknown as File;
}

function makeMockFileHandle(
  name: string,
  content: string,
): FileSystemFileHandle {
  const writable = {
    write: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  };
  return {
    kind: "file" as const,
    name,
    getFile: () => Promise.resolve(makeMockFile(name, content)),
    createWritable: () => Promise.resolve(writable),
  } as unknown as FileSystemFileHandle;
}

function makeMockDirHandle(
  entries: Array<[string, { kind: string } & Record<string, unknown>]>,
): FileSystemDirectoryHandle {
  return {
    kind: "directory" as const,
    name: "test-dir",
    entries: () => ({
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
    }),
  } as unknown as FileSystemDirectoryHandle;
}

describe("scanDirectory", () => {
  it("parses Noti-format .md files", async () => {
    const content = "---\ntitle: My Note\ndate: 2024-03-22T13:18:56\ntags:\n  - work\n---\nBody";
    const handle = makeMockFileHandle("20240322T131856--my-note.md", content);
    const dir = makeMockDirHandle([
      ["20240322T131856--my-note.md", handle as unknown as { kind: string }],
    ]);

    const notes = await scanDirectory(dir);
    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe("20240322T131856");
    expect(notes[0].title).toBe("My Note");
    expect(notes[0].tags).toEqual(["work"]);
    expect(notes[0].isNotiFormat).toBe(true);
  });

  it("handles non-Noti .md files gracefully", async () => {
    const content = "Just plain markdown";
    const handle = makeMockFileHandle("README.md", content);
    const dir = makeMockDirHandle([
      ["README.md", handle as unknown as { kind: string }],
    ]);

    const notes = await scanDirectory(dir);
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("README");
    expect(notes[0].tags).toEqual([]);
    expect(notes[0].isNotiFormat).toBe(false);
  });

  it("ignores non-.md files", async () => {
    const mdHandle = makeMockFileHandle("20240101T000000--note.md", "---\ntitle: Note\ntags:\n---\n");
    const txtHandle = { kind: "file", name: "notes.txt" };
    const imgHandle = { kind: "file", name: "image.png" };
    const dir = makeMockDirHandle([
      ["20240101T000000--note.md", mdHandle as unknown as { kind: string }],
      ["notes.txt", txtHandle as { kind: string }],
      ["image.png", imgHandle as { kind: string }],
    ]);

    const notes = await scanDirectory(dir);
    expect(notes).toHaveLength(1);
    expect(notes[0].filename).toBe("20240101T000000--note.md");
  });

  it("ignores subdirectories", async () => {
    const mdHandle = makeMockFileHandle("20240101T000000.md", "---\ntitle: Note\ntags:\n---\n");
    const dirEntry = { kind: "directory", name: "subdir" };
    const dir = makeMockDirHandle([
      ["subdir", dirEntry as { kind: string }],
      ["20240101T000000.md", mdHandle as unknown as { kind: string }],
    ]);

    const notes = await scanDirectory(dir);
    expect(notes).toHaveLength(1);
  });

  it("uses filename slug as title when no front matter title", async () => {
    const content = "---\ntags:\n---\nBody";
    const handle = makeMockFileHandle("20240322T131856--meeting-notes.md", content);
    const dir = makeMockDirHandle([
      ["20240322T131856--meeting-notes.md", handle as unknown as { kind: string }],
    ]);

    const notes = await scanDirectory(dir);
    expect(notes[0].title).toBe("Meeting Notes");
  });

  it("uses 'Untitled' for Noti files with no title slug and no front matter title", async () => {
    const content = "---\ntags:\n---\nBody";
    const handle = makeMockFileHandle("20240322T131856.md", content);
    const dir = makeMockDirHandle([
      ["20240322T131856.md", handle as unknown as { kind: string }],
    ]);

    const notes = await scanDirectory(dir);
    expect(notes[0].title).toBe("Untitled");
  });

  it("returns empty array for empty directory", async () => {
    const dir = makeMockDirHandle([]);
    const notes = await scanDirectory(dir);
    expect(notes).toEqual([]);
  });
});

describe("readNoteContent", () => {
  it("reads file content as text", async () => {
    const handle = makeMockFileHandle("test.md", "Hello World");
    const content = await readNoteContent(handle);
    expect(content).toBe("Hello World");
  });
});

describe("writeFile", () => {
  it("writes content via writable stream", async () => {
    const writable = {
      write: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
    };
    const handle = {
      createWritable: () => Promise.resolve(writable),
    } as unknown as FileSystemFileHandle;

    await writeFile(handle, "New content");
    expect(writable.write).toHaveBeenCalledWith("New content");
    expect(writable.close).toHaveBeenCalled();
  });
});
