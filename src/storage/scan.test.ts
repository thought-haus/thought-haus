import { describe, it, expect, vi } from "vitest";
import { scanNotes } from "./scan.ts";
import type { StorageBackend, FileEntry } from "./backend.ts";

function mockBackend(
  entries: FileEntry[],
  contentMap: Record<string, string>,
): StorageBackend {
  return {
    type: "local" as const,
    name: "test-dir",
    list: vi.fn(() => Promise.resolve(entries)),
    read: vi.fn((filename: string) =>
      Promise.resolve(contentMap[filename] ?? ""),
    ),
    write: vi.fn(() => Promise.resolve({ lastModified: Date.now(), size: 0 })),
    delete: vi.fn(() => Promise.resolve()),
    getMetadata: vi.fn(() =>
      Promise.resolve({ lastModified: Date.now(), size: 0 }),
    ),
    writeBinary: vi.fn(() => Promise.resolve()),
    readBinaryURL: vi.fn(() => Promise.resolve("blob:test")),
    listDir: vi.fn(() => Promise.resolve([])),
    deleteDir: vi.fn(() => Promise.resolve()),
    disconnect: vi.fn(),
  };
}

describe("scanNotes", () => {
  it("parses Noti-format .md files", async () => {
    const content =
      "---\ntitle: My Note\ndate: 2024-03-22T13:18:56\ntags:\n  - work\n---\nBody";
    const backend = mockBackend(
      [
        {
          filename: "20240322T131856--my-note.md",
          lastModified: 1000,
          size: content.length,
        },
      ],
      { "20240322T131856--my-note.md": content },
    );

    const notes = await scanNotes(backend);
    expect(notes).toHaveLength(1);
    expect(notes[0].id).toBe("20240322T131856");
    expect(notes[0].title).toBe("My Note");
    expect(notes[0].tags).toEqual(["work"]);
    expect(notes[0].isNotiFormat).toBe(true);
  });

  it("handles non-Noti .md files gracefully", async () => {
    const content = "Just plain markdown";
    const backend = mockBackend(
      [{ filename: "README.md", lastModified: 1000, size: content.length }],
      { "README.md": content },
    );

    const notes = await scanNotes(backend);
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe("README");
    expect(notes[0].tags).toEqual([]);
    expect(notes[0].isNotiFormat).toBe(false);
  });

  it("ignores non-.md files", async () => {
    const content = "---\ntitle: Note\ntags:\n---\n";
    const backend = mockBackend(
      [
        {
          filename: "20240101T000000--note.md",
          lastModified: 1000,
          size: content.length,
        },
        { filename: "notes.txt", lastModified: 1000, size: 10 },
        { filename: "image.png", lastModified: 1000, size: 10 },
      ],
      { "20240101T000000--note.md": content },
    );

    const notes = await scanNotes(backend);
    expect(notes).toHaveLength(1);
    expect(notes[0].filename).toBe("20240101T000000--note.md");
  });

  it("uses filename slug as title when no front matter title", async () => {
    const content = "---\ntags:\n---\nBody";
    const backend = mockBackend(
      [
        {
          filename: "20240322T131856--meeting-notes.md",
          lastModified: 1000,
          size: content.length,
        },
      ],
      { "20240322T131856--meeting-notes.md": content },
    );

    const notes = await scanNotes(backend);
    expect(notes[0].title).toBe("Meeting Notes");
  });

  it("uses 'Untitled' for Noti files with no title slug and no front matter title", async () => {
    const content = "---\ntags:\n---\nBody";
    const backend = mockBackend(
      [
        {
          filename: "20240322T131856.md",
          lastModified: 1000,
          size: content.length,
        },
      ],
      { "20240322T131856.md": content },
    );

    const notes = await scanNotes(backend);
    expect(notes[0].title).toBe("Untitled");
  });

  it("returns empty array for empty directory", async () => {
    const backend = mockBackend([], {});
    const notes = await scanNotes(backend);
    expect(notes).toEqual([]);
  });

  it("parses createdAt from Noti timestamp ID", async () => {
    const content = "---\ntitle: Test\ntags:\n---\n";
    const backend = mockBackend(
      [
        {
          filename: "20240322T131856--test.md",
          lastModified: 9999,
          size: content.length,
        },
      ],
      { "20240322T131856--test.md": content },
    );

    const notes = await scanNotes(backend);
    expect(notes[0].createdAt.getFullYear()).toBe(2024);
    expect(notes[0].createdAt.getMonth()).toBe(2); // March = 2
    expect(notes[0].createdAt.getDate()).toBe(22);
  });

  it("uses lastModified as createdAt for non-Noti files", async () => {
    const content = "Just markdown";
    const ts = new Date("2025-01-15T10:30:00").getTime();
    const backend = mockBackend(
      [{ filename: "notes.md", lastModified: ts, size: content.length }],
      { "notes.md": content },
    );

    const notes = await scanNotes(backend);
    expect(notes[0].createdAt.getTime()).toBe(ts);
  });

  it("collects tags from frontmatter", async () => {
    const content =
      "---\ntitle: Tagged\ntags:\n  - work\n  - important\n---\nBody";
    const backend = mockBackend(
      [
        {
          filename: "20240101T000000--tagged.md",
          lastModified: 1000,
          size: content.length,
        },
      ],
      { "20240101T000000--tagged.md": content },
    );

    const notes = await scanNotes(backend);
    expect(notes[0].tags).toEqual(["work", "important"]);
  });

  it("preserves lastModified and size from FileEntry", async () => {
    const content = "---\ntitle: Test\ntags:\n---\n";
    const backend = mockBackend(
      [
        {
          filename: "20240101T000000--test.md",
          lastModified: 42000,
          size: 999,
        },
      ],
      { "20240101T000000--test.md": content },
    );

    const notes = await scanNotes(backend);
    expect(notes[0].lastModified).toBe(42000);
    expect(notes[0].size).toBe(999);
  });
});
