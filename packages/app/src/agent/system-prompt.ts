import { selectedNoteId, storageBackend } from "../lib/app-state.ts";
import { notesMap, getNote } from "../notes/note-store.ts";
import { parseFrontMatter } from "@thought-haus/core";
import { CONVERSATION_TAG, MEMORY_TAG, SKILL_TAG } from "./conversation-format.ts";

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
  parts.push(`You are the Thought.Haus AI assistant, embedded in a local-first note-taking app. You help users manage their notes.

Available tools:
- read_note: Read a note's full content by ID
- create_note: Create a new note with title, body, and optional tags
- edit_note: Edit a note's body content by ID
- delete_note: Delete a note by ID
- search_notes: Full-text search across all notes
- list_notes: List notes, optionally filtered by tag
- load_skill: Load the full content of a skill note by ID (use when a skill is relevant to the user's request)
- run_javascript: Execute JavaScript code in the browser. Has full access to browser APIs including document/DOM, window, fetch, localStorage, navigator, Canvas, Web APIs, etc. Code runs in the page context of the Thought.Haus app. Supports async/await. Simple expressions auto-return their value. For multi-statement code, use \`return\` to return a value.`);

  // Memory notes
  const memoryNotes = await loadMemoryNotes();
  if (memoryNotes) {
    parts.push(`## Your Memory\nThe following are your persistent memory notes:\n\n${memoryNotes}`);
  }

  // Skill descriptions
  const skillDescriptions = loadSkillDescriptions();
  if (skillDescriptions) {
    parts.push(`## Available Skills\nThe following skills are available. Use \`load_skill\` with the skill's ID to load its full instructions when relevant to the user's request. If a loaded skill contains \`[[note ID]]\` links, use \`read_note\` to also read those linked notes for full context.\n\n${skillDescriptions}`);
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
- User messages may contain @-mentions like @"Note Title" referencing notes whose content is provided inline. Refer to the note by its title.
- You can create memory notes (tagged "th-agent-memory") to remember things across conversations`);

  return parts.join("\n\n");
}

async function loadMemoryNotes(): Promise<string | null> {
  const backend = storageBackend.value;
  if (!backend) return null;

  const memoryNotes: { title: string; body: string; lastModified: number }[] = [];
  for (const note of notesMap.value.values()) {
    if (note.tags.includes(MEMORY_TAG)) {
      try {
        const content = await backend.read(note.filename);
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

function loadSkillDescriptions(): string | null {
  const skills: { title: string; id: string; description: string }[] = [];
  for (const note of notesMap.value.values()) {
    if (note.tags.includes(SKILL_TAG) && note.properties.description) {
      skills.push({
        title: note.title,
        id: note.id,
        description: note.properties.description,
      });
    }
  }

  if (skills.length === 0) return null;

  skills.sort((a, b) => a.title.localeCompare(b.title));
  return skills.map((s) => `- **${s.title}** (ID: ${s.id}): ${s.description}`).join("\n");
}

async function loadCurrentNoteContext(): Promise<string | null> {
  const noteId = selectedNoteId.value;
  if (!noteId) return null;

  const note = getNote(noteId);
  if (!note) return null;

  // Skip conversation notes
  if (note.tags.includes(CONVERSATION_TAG)) return null;

  const backend = storageBackend.value;
  if (!backend) return null;

  try {
    const content = await backend.read(note.filename);
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
