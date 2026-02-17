import type { StorageBackend, Note } from "@thought-haus/core";
import { parseFilename, slugToTitle, parseFrontMatter, parseTimestampId } from "@thought-haus/core";

/** Scan a storage backend for .md files and return parsed Note objects. */
export async function scanNotes(
  backend: StorageBackend,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Note[]> {
  const entries = await backend.list();
  const mdEntries = entries.filter((e) => e.filename.endsWith(".md"));
  const notes: Note[] = [];

  for (const entry of mdEntries) {
    const parsed = parseFilename(entry.filename);
    if (!parsed) {
      onProgress?.(notes.length, mdEntries.length);
      continue;
    }

    const content = await backend.read(entry.filename);
    const { frontMatter } = parseFrontMatter(content);

    let title: string;
    if (frontMatter.title) {
      title = frontMatter.title;
    } else if (parsed.isTimestampFormat && parsed.titleSlug) {
      title = slugToTitle(parsed.titleSlug);
    } else if (!parsed.isTimestampFormat) {
      title = entry.filename.replace(/\.md$/, "");
    } else {
      title = "Untitled";
    }

    let createdAt: Date;
    if (parsed.isTimestampFormat) {
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
      isTimestampFormat: parsed.isTimestampFormat,
      createdAt,
    });
    onProgress?.(notes.length, mdEntries.length);
  }

  return notes;
}
