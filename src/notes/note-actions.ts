import { storageBackend, selectedNoteId } from "../lib/app-state.ts";
import { formatTimestampId } from "../lib/date.ts";
import { generateFilename } from "./filename.ts";
import { parseFrontMatter, serializeFrontMatter } from "./frontmatter.ts";
import { upsertNote, removeNote, getNote } from "./note-store.ts";
import {
  addToIndex,
  removeFromIndex,
  updateInIndex,
} from "../search/search-engine.ts";
import { deleteNoteAttachments } from "../attachments/attachment-service.ts";
import type { Note } from "./note.ts";

const WELCOME_BODY = `Welcome to Noti! This is your first note.

Noti stores your notes as plain Markdown files in the folder you selected.
You can edit them here or in any text editor.

## Getting Started

- **Create a note** with the + button or Cmd/Ctrl+N
- **Search** your notes with the search bar
- **Tag** your notes to organize them
- Notes are **auto-saved** as you type

Happy writing!
`;

/** Create a new note and return it. */
export async function createNote(): Promise<Note | null> {
  const backend = storageBackend.value;
  if (!backend) return null;

  const now = new Date();
  const id = formatTimestampId(now);
  const title = "Untitled";
  const filename = generateFilename(now, title);

  const frontMatter = {
    title,
    date: now.toISOString().replace("Z", ""),
    tags: [],
  };
  const content = serializeFrontMatter(frontMatter, "\n");

  const meta = await backend.write(filename, content);

  const note: Note = {
    id,
    title,
    tags: [],
    filename,
    lastModified: meta.lastModified,
    size: meta.size,
    isNotiFormat: true,
    createdAt: now,
  };

  upsertNote(note);
  selectedNoteId.value = note.id;
  addToIndex({ id: note.id, title: note.title, tags: note.tags, body: "\n" });
  return note;
}

/** Delete a note by ID. */
export async function deleteNote(id: string): Promise<boolean> {
  const backend = storageBackend.value;
  if (!backend) return false;

  const note = getNote(id);
  if (!note) return false;

  try {
    await backend.delete(note.filename);
    await deleteNoteAttachments(note);
    removeNote(id);
    removeFromIndex(id);
    if (selectedNoteId.value === id) {
      selectedNoteId.value = null;
    }
    return true;
  } catch {
    return false;
  }
}

/** Rename a note: update title in store, rewrite file with new frontmatter, rename on disk. */
export async function renameNote(
  id: string,
  newTitle: string,
): Promise<boolean> {
  const backend = storageBackend.value;
  if (!backend) return false;

  const note = getNote(id);
  if (!note) return false;

  const title = newTitle.trim() || "Untitled";
  if (title === note.title) return true;

  const oldFilename = note.filename;
  const newFilename = generateFilename(note.createdAt, title);

  // Read current content and re-serialize with updated title
  const rawContent = await backend.read(note.filename);
  const { body } = parseFrontMatter(rawContent);
  const content = serializeFrontMatter(
    {
      title,
      date: note.createdAt.toISOString().replace("Z", ""),
      tags: note.tags,
    },
    body,
  );

  // Write to new file, then delete old
  const meta = await backend.write(newFilename, content);

  if (newFilename !== oldFilename) {
    await backend.delete(oldFilename);
  }

  upsertNote({
    ...note,
    title,
    filename: newFilename,
    lastModified: meta.lastModified,
    size: meta.size,
  });

  updateInIndex({ id: note.id, title, tags: note.tags, body });

  return true;
}

/** Create a welcome note in an empty folder. */
export async function createWelcomeNote(): Promise<Note | null> {
  const backend = storageBackend.value;
  if (!backend) return null;

  const now = new Date();
  const id = formatTimestampId(now);
  const title = "Welcome to Noti";
  const filename = generateFilename(now, title);

  const frontMatter = {
    title,
    date: now.toISOString().replace("Z", ""),
    tags: ["getting-started"],
  };
  const content = serializeFrontMatter(frontMatter, WELCOME_BODY);

  const meta = await backend.write(filename, content);

  const note: Note = {
    id,
    title,
    tags: ["getting-started"],
    filename,
    lastModified: meta.lastModified,
    size: meta.size,
    isNotiFormat: true,
    createdAt: now,
  };

  upsertNote(note);
  selectedNoteId.value = note.id;
  addToIndex({
    id: note.id,
    title: note.title,
    tags: note.tags,
    body: WELCOME_BODY,
  });
  return note;
}
