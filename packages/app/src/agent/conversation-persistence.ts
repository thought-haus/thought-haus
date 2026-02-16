import type { Note } from "@thought-haus/core";
import { formatTimestampId, generateFilename } from "@thought-haus/core";
import { storageBackend } from "../lib/app-state.ts";
import { upsertNote, getNote, notesMap } from "../notes/note-store.ts";
import { addToIndex, updateInIndex } from "../search/search-engine.ts";
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
  const backend = storageBackend.value;
  if (!backend) return null;

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
    properties: {},
  };

  const content = serializeConversationNote(frontMatter, []);
  const meta = await backend.write(filename, content);

  const note: Note = {
    id,
    title,
    tags: [CONVERSATION_TAG],
    properties: {},
    filename,
    lastModified: meta.lastModified,
    size: meta.size,
    isTimestampFormat: true,
    createdAt: now,
  };

  upsertNote(note);
  addToIndex({ id: note.id, title: note.title, tags: note.tags, body: "", lastModified: note.lastModified });
  return id;
}

/** Save messages to a conversation note. */
export async function saveConversation(
  noteId: string,
  messages: Message[],
): Promise<void> {
  const note = getNote(noteId);
  if (!note) return;

  const backend = storageBackend.value;
  if (!backend) return;

  try {
    const rawContent = await backend.read(note.filename);
    const { frontMatter } = parseConversationNote(rawContent);
    const content = serializeConversationNote(frontMatter, messages);
    const meta = await backend.write(note.filename, content);

    upsertNote({
      ...note,
      lastModified: meta.lastModified,
      size: meta.size,
    });
    updateInIndex({
      id: note.id,
      title: note.title,
      tags: note.tags,
      body: "",
      lastModified: meta.lastModified,
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

  const backend = storageBackend.value;
  if (!backend) return [];

  const rawContent = await backend.read(note.filename);
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
