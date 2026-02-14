import type { StorageBackend } from "./backend.ts";
import type { Note } from "../notes/note.ts";
import { parseFilename, slugToTitle } from "../notes/filename.ts";
import { parseFrontMatter } from "../notes/frontmatter.ts";
import { parseTimestampId } from "../lib/date.ts";

/** Scan a storage backend for .md files and return parsed Note objects. */
export async function scanNotes(backend: StorageBackend): Promise<Note[]> {
  const entries = await backend.list();
  const notes: Note[] = [];

  for (const entry of entries) {
    if (!entry.filename.endsWith(".md")) continue;

    const parsed = parseFilename(entry.filename);
    if (!parsed) continue;

    const content = await backend.read(entry.filename);
    const { frontMatter } = parseFrontMatter(content);

    let title: string;
    if (frontMatter.title) {
      title = frontMatter.title;
    } else if (parsed.isNotiFormat && parsed.titleSlug) {
      title = slugToTitle(parsed.titleSlug);
    } else if (!parsed.isNotiFormat) {
      title = entry.filename.replace(/\.md$/, "");
    } else {
      title = "Untitled";
    }

    let createdAt: Date;
    if (parsed.isNotiFormat) {
      createdAt = parseTimestampId(parsed.id) ?? new Date(entry.lastModified);
    } else {
      createdAt = new Date(entry.lastModified);
    }

    notes.push({
      id: parsed.id,
      title,
      tags: frontMatter.tags,
      properties: frontMatter.properties,
      filename: entry.filename,
      lastModified: entry.lastModified,
      size: entry.size,
      isNotiFormat: parsed.isNotiFormat,
      createdAt,
    });
  }

  return notes;
}
