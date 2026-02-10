import { directoryHandle, selectedNoteId } from "../lib/app-state.ts";
import { formatTimestampId } from "../lib/date.ts";
import { generateFilename } from "./filename.ts";
import { serializeFrontMatter } from "./frontmatter.ts";
import { upsertNote, removeNote, getNote } from "./note-store.ts";
import { writeFile } from "../fs/file-ops.ts";
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
  const dirHandle = directoryHandle.value;
  if (!dirHandle) return null;

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

  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  await writeFile(fileHandle, content);

  const file = await fileHandle.getFile();
  const note: Note = {
    id,
    title,
    tags: [],
    filename,
    fileHandle,
    lastModified: file.lastModified,
    size: file.size,
    isNotiFormat: true,
    createdAt: now,
  };

  upsertNote(note);
  selectedNoteId.value = note.id;
  return note;
}

/** Delete a note by ID. */
export async function deleteNote(id: string): Promise<boolean> {
  const dirHandle = directoryHandle.value;
  if (!dirHandle) return false;

  const note = getNote(id);
  if (!note) return false;

  try {
    await dirHandle.removeEntry(note.filename);
    removeNote(id);
    if (selectedNoteId.value === id) {
      selectedNoteId.value = null;
    }
    return true;
  } catch {
    return false;
  }
}

/** Create a welcome note in an empty folder. */
export async function createWelcomeNote(): Promise<Note | null> {
  const dirHandle = directoryHandle.value;
  if (!dirHandle) return null;

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

  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  await writeFile(fileHandle, content);

  const file = await fileHandle.getFile();
  const note: Note = {
    id,
    title,
    tags: ["getting-started"],
    filename,
    fileHandle,
    lastModified: file.lastModified,
    size: file.size,
    isNotiFormat: true,
    createdAt: now,
  };

  upsertNote(note);
  selectedNoteId.value = note.id;
  return note;
}
