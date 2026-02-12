import { selectedNoteId } from "../lib/app-state.ts";
import { notesMap, getNote } from "../notes/note-store.ts";
import { readNoteContent } from "../fs/file-ops.ts";
import { parseFrontMatter } from "../notes/frontmatter.ts";
import { CONVERSATION_TAG, MEMORY_TAG } from "./conversation-format.ts";

const MAX_MEMORY_CHARS = 8000;
const MAX_NOTE_CHARS = 12000;

export async function buildSystemPrompt(commandBody?: string): Promise<string> {
  const parts: string[] = [];

  // Date/time
  parts.push(
    `Current date and time: ${new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`,
  );

  // Capabilities
  parts.push(`You are the Noti AI assistant, embedded in a local-first note-taking app. You help users manage their notes.

Available tools:
- read_note: Read a note's full content by ID
- create_note: Create a new note with title, body, and optional tags
- edit_note: Edit a note's body content by ID
- delete_note: Delete a note by ID
- search_notes: Full-text search across all notes
- list_notes: List notes, optionally filtered by tag
- run_javascript: Execute JavaScript code and return the result`);

  // Memory notes
  const memoryNotes = await loadMemoryNotes();
  if (memoryNotes) {
    parts.push(`## Your Memory\nThe following are your persistent memory notes:\n\n${memoryNotes}`);
  }

  // Currently open note
  const noteContext = await loadCurrentNoteContext();
  if (noteContext) {
    parts.push(`## Currently Open Note\n${noteContext}`);
  }

  // Slash command instructions
  if (commandBody) {
    parts.push(`## Slash Command Instructions
The user's message starts with a slash command (e.g. "/command-name"). This means they are invoking a reusable command. Follow the instructions below, and treat any text after the command name as the user's input for this command.

${commandBody}`);
  }

  // Guidelines
  parts.push(`## Guidelines
- Be concise and helpful
- When creating or editing notes, use proper Markdown formatting
- Note IDs follow the pattern YYYYMMDDTHHMMSS (e.g., 20240322T131856)
- Tags are plain strings without # prefix
- When searching, use specific keywords for better results
- If a user asks about their notes, search first before answering
- You can create memory notes (tagged "noti-agent-memory") to remember things across conversations`);

  return parts.join("\n\n");
}

async function loadMemoryNotes(): Promise<string | null> {
  const memoryNotes: { title: string; body: string; lastModified: number }[] = [];
  for (const note of notesMap.value.values()) {
    if (note.tags.includes(MEMORY_TAG)) {
      try {
        const content = await readNoteContent(note.fileHandle);
        const { frontMatter, body } = parseFrontMatter(content);
        memoryNotes.push({
          title: frontMatter.title || note.title,
          body: body.trim(),
          lastModified: note.lastModified,
        });
      } catch {
        // Skip unreadable notes
      }
    }
  }

  if (memoryNotes.length === 0) return null;

  // Sort by most recently modified first
  memoryNotes.sort((a, b) => b.lastModified - a.lastModified);

  let result = "";
  for (const mem of memoryNotes) {
    const entry = `### ${mem.title}\n${mem.body}\n\n`;
    if (result.length + entry.length > MAX_MEMORY_CHARS) break;
    result += entry;
  }

  return result.trim() || null;
}

async function loadCurrentNoteContext(): Promise<string | null> {
  const noteId = selectedNoteId.value;
  if (!noteId) return null;

  const note = getNote(noteId);
  if (!note) return null;

  // Skip conversation notes
  if (note.tags.includes(CONVERSATION_TAG)) return null;

  try {
    const content = await readNoteContent(note.fileHandle);
    const { frontMatter, body } = parseFrontMatter(content);

    let noteBody = body.trim();
    let truncated = false;
    if (noteBody.length > MAX_NOTE_CHARS) {
      noteBody = noteBody.slice(0, MAX_NOTE_CHARS);
      truncated = true;
    }

    const tagStr = note.tags.length > 0 ? `\nTags: ${note.tags.join(", ")}` : "";
    return `Title: ${frontMatter.title || note.title}\nID: ${note.id}${tagStr}\n\n${noteBody}${truncated ? "\n\n...(truncated)" : ""}`;
  } catch {
    return null;
  }
}
