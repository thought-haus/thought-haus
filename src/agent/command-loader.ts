import type { Note } from "../notes/note.ts";
import { notesMap } from "../notes/note-store.ts";
import { storageBackend } from "../lib/app-state.ts";
import { parseFrontMatter } from "../notes/frontmatter.ts";
import { COMMAND_TAG } from "./conversation-format.ts";

/** Return all notes tagged noti-command. */
export function getCommandNotes(): Note[] {
  const notes: Note[] = [];
  for (const note of notesMap.value.values()) {
    if (note.tags.includes(COMMAND_TAG)) {
      notes.push(note);
    }
  }
  return notes;
}

/** Read a command note's file and return the trimmed body (without frontmatter). */
export async function loadCommandBody(note: Note): Promise<string> {
  const backend = storageBackend.value;
  if (!backend) return "";
  const content = await backend.read(note.filename);
  const { body } = parseFrontMatter(content);
  return body.trim();
}

const SLASH_RE = /^\/([a-z0-9-]+)(?:\s(.*))?$/s;

/** Parse `/slug some text` from input. Returns null if input doesn't start with `/`. */
export function parseSlashCommand(
  text: string,
): { commandSlug: string; userText: string } | null {
  const match = text.match(SLASH_RE);
  if (!match) return null;
  return { commandSlug: match[1], userText: match[2]?.trim() ?? "" };
}
