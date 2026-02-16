import type { Note } from "@thought-haus/core";
import { parseFrontMatter } from "@thought-haus/core";
import { notesMap } from "../notes/note-store.ts";
import { storageBackend } from "../lib/app-state.ts";
import { CONVERSATION_TAG } from "./conversation-format.ts";

/**
 * Scan backward from cursor for an `@` trigger.
 * Returns the partial query and start position, or null if no active mention.
 */
export function getAtMentionQuery(
  text: string,
  cursorPos: number,
): { query: string; start: number } | null {
  // Walk backward from cursor to find `@`
  let i = cursorPos - 1;
  while (i >= 0 && text[i] !== "@") {
    // If we hit a closing quote before @, the mention is already complete
    if (text[i] === '"' && i > 0) {
      // Check if there's an opening quote + @ before this
      const before = text.lastIndexOf('@"', i);
      if (before >= 0 && text.indexOf('"', before + 2) <= i) {
        return null; // Already closed mention
      }
    }
    i--;
  }

  if (i < 0) return null;

  // `@` must be preceded by start-of-string or whitespace
  if (i > 0 && !/\s/.test(text[i - 1])) return null;

  const afterAt = text.slice(i + 1, cursorPos);

  // If there's a complete quoted mention (both opening and closing quote), no active query
  if (afterAt.startsWith('"') && afterAt.slice(1).includes('"')) return null;

  // Strip leading quote if present
  const query = afterAt.startsWith('"') ? afterAt.slice(1) : afterAt;

  return { query, start: i };
}

const MENTION_RE = /@"([^"]+)"/g;

/**
 * Expand all `@"Title"` mentions in text by replacing them with the note's body content.
 * Unmatched mentions are left as-is.
 */
export async function expandMentions(text: string): Promise<string> {
  const matches = [...text.matchAll(MENTION_RE)];
  if (matches.length === 0) return text;

  const backend = storageBackend.value;
  if (!backend) return text;

  // Build a map of title (lowercase) -> Note for quick lookup
  const notesByTitle = new Map<string, Note>();
  for (const note of notesMap.value.values()) {
    notesByTitle.set(note.title.toLowerCase(), note);
  }

  // Process matches in reverse order so indices stay valid
  let result = text;
  for (let m = matches.length - 1; m >= 0; m--) {
    const match = matches[m];
    const title = match[1];
    const note = notesByTitle.get(title.toLowerCase());
    if (!note) continue;

    try {
      const content = await backend.read(note.filename);
      const { body } = parseFrontMatter(content);
      const expansion = `[Note: "${note.title}"]:\n${body.trim()}\n[End of note]`;
      result =
        result.slice(0, match.index!) +
        expansion +
        result.slice(match.index! + match[0].length);
    } catch {
      // Leave mention as-is if note can't be read
    }
  }

  return result;
}

/** Get all notes excluding conversation notes. */
export function getNonConversationNotes(): Note[] {
  const notes: Note[] = [];
  for (const note of notesMap.value.values()) {
    if (!note.tags.includes(CONVERSATION_TAG)) {
      notes.push(note);
    }
  }
  return notes;
}
