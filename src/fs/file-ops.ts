import type { Note } from "../notes/note.ts";
import { parseFilename, slugToTitle } from "../notes/filename.ts";
import { parseFrontMatter } from "../notes/frontmatter.ts";
import { parseTimestampId } from "../lib/date.ts";

/** Scan a directory for .md files and return parsed Note objects. */
export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
): Promise<Note[]> {
  const notes: Note[] = [];

  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind !== "file" || !name.endsWith(".md")) continue;

    const fileHandle = handle as FileSystemFileHandle;
    const parsed = parseFilename(name);
    if (!parsed) continue;

    const file = await fileHandle.getFile();
    const content = await file.text();
    const { frontMatter } = parseFrontMatter(content);

    let title: string;
    if (frontMatter.title) {
      title = frontMatter.title;
    } else if (parsed.isNotiFormat && parsed.titleSlug) {
      title = slugToTitle(parsed.titleSlug);
    } else if (!parsed.isNotiFormat) {
      title = name.replace(/\.md$/, "");
    } else {
      title = "Untitled";
    }

    let createdAt: Date;
    if (parsed.isNotiFormat) {
      createdAt = parseTimestampId(parsed.id) ?? new Date(file.lastModified);
    } else {
      createdAt = new Date(file.lastModified);
    }

    notes.push({
      id: parsed.id,
      title,
      tags: frontMatter.tags,
      filename: name,
      fileHandle,
      lastModified: file.lastModified,
      size: file.size,
      isNotiFormat: parsed.isNotiFormat,
      createdAt,
    });
  }

  return notes;
}

/** Read the full text content of a note. */
export async function readNoteContent(
  fileHandle: FileSystemFileHandle,
): Promise<string> {
  const file = await fileHandle.getFile();
  return file.text();
}

/** Write content to a file. */
export async function writeFile(
  fileHandle: FileSystemFileHandle,
  content: string,
): Promise<void> {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}
