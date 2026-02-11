import { directoryHandle } from "../lib/app-state.ts";
import { formatTimestampId } from "../lib/date.ts";
import { generateFilename } from "../notes/filename.ts";
import { upsertNote, getNote, notesMap } from "../notes/note-store.ts";
import { readNoteContent, writeFile } from "../fs/file-ops.ts";
import { addToIndex, updateInIndex } from "../search/search-engine.ts";
import type { Note } from "../notes/note.ts";
import type { Message } from "@mariozechner/pi-ai";
import {
  activeConversationId,
  conversationMessages,
} from "./agent-state.ts";
import {
  CONVERSATION_TAG,
  parseConversationNote,
  serializeConversationNote,
} from "./conversation-format.ts";

/** Create a new conversation note and return its ID. */
export async function createConversationNote(): Promise<string | null> {
  const dirHandle = directoryHandle.value;
  if (!dirHandle) return null;

  const now = new Date();
  const id = formatTimestampId(now);
  const title = `Conversation - ${now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })}`;
  const filename = generateFilename(now, title);

  const frontMatter = {
    title,
    date: now.toISOString().replace("Z", ""),
    tags: [CONVERSATION_TAG],
  };

  const content = serializeConversationNote(frontMatter, []);
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  await writeFile(fileHandle, content);

  const file = await fileHandle.getFile();
  const note: Note = {
    id,
    title,
    tags: [CONVERSATION_TAG],
    filename,
    fileHandle,
    lastModified: file.lastModified,
    size: file.size,
    isNotiFormat: true,
    createdAt: now,
  };

  upsertNote(note);
  addToIndex({ id: note.id, title: note.title, tags: note.tags, body: "" });
  return id;
}

/** Save messages to a conversation note. */
export async function saveConversation(
  noteId: string,
  messages: Message[],
): Promise<void> {
  const note = getNote(noteId);
  if (!note) return;

  try {
    const rawContent = await readNoteContent(note.fileHandle);
    const { frontMatter } = parseConversationNote(rawContent);
    const content = serializeConversationNote(frontMatter, messages);
    await writeFile(note.fileHandle, content);

    const file = await note.fileHandle.getFile();
    upsertNote({
      ...note,
      lastModified: file.lastModified,
      size: file.size,
    });
    updateInIndex({
      id: note.id,
      title: note.title,
      tags: note.tags,
      body: "",
    });
  } catch {
    // Note may have been deleted externally
  }
}

/** Load messages from a conversation note. */
export async function loadConversation(
  noteId: string,
): Promise<Message[]> {
  const note = getNote(noteId);
  if (!note) return [];

  const rawContent = await readNoteContent(note.fileHandle);
  const { messages } = parseConversationNote(rawContent);
  return messages;
}

/** List all conversation notes, sorted newest first. */
export function listConversations(): Note[] {
  const notes: Note[] = [];
  for (const note of notesMap.value.values()) {
    if (note.tags.includes(CONVERSATION_TAG)) {
      notes.push(note);
    }
  }
  return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/** Switch to a different conversation, loading its messages. */
export async function switchConversation(noteId: string): Promise<void> {
  // Save current conversation before switching
  const currentId = activeConversationId.value;
  if (currentId && conversationMessages.value.length > 0) {
    await saveConversation(currentId, conversationMessages.value);
  }

  const messages = await loadConversation(noteId);
  conversationMessages.value = messages;
  activeConversationId.value = noteId;
}
