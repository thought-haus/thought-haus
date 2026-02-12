import { Type } from "@mariozechner/pi-ai";
import type { AgentTool, AgentToolResult } from "@mariozechner/pi-agent-core";
import { directoryHandle } from "../lib/app-state.ts";
import { formatTimestampId } from "../lib/date.ts";
import { generateFilename } from "../notes/filename.ts";
import {
  parseFrontMatter,
  serializeFrontMatter,
} from "../notes/frontmatter.ts";
import { upsertNote, removeNote, getNote, notesMap } from "../notes/note-store.ts";
import { readNoteContent, writeFile } from "../fs/file-ops.ts";
import {
  addToIndex,
  updateInIndex,
  removeFromIndex,
  queryIndex,
} from "../search/search-engine.ts";
import type { Note } from "../notes/note.ts";

type P = Record<string, unknown>;

function text(t: string): AgentToolResult<unknown> {
  return { content: [{ type: "text", text: t }], details: {} };
}

function err(t: string): AgentToolResult<unknown> {
  return { content: [{ type: "text", text: t }], details: { isError: true } };
}

export function createTools(): AgentTool[] {
  const readNote: AgentTool = {
    name: "read_note",
    label: "Read Note",
    description: "Read a note's full content by its ID.",
    parameters: Type.Object({
      noteId: Type.String({ description: "The note ID to read" }),
    }),
    execute: async (_id, raw) => {
      const p = raw as P;
      const noteId = p.noteId as string;
      const note = getNote(noteId);
      if (!note) return err(`Note "${noteId}" not found.`);

      const content = await readNoteContent(note.fileHandle);
      const { frontMatter, body } = parseFrontMatter(content);
      const tagStr = note.tags.length > 0 ? `\nTags: ${note.tags.join(", ")}` : "";
      return text(`Title: ${frontMatter.title || note.title}\nID: ${note.id}${tagStr}\n\n${body.trim()}`);
    },
  };

  const createNote: AgentTool = {
    name: "create_note",
    label: "Create Note",
    description: "Create a new note with a title, body, and optional tags.",
    parameters: Type.Object({
      title: Type.String({ description: "The note title" }),
      body: Type.String({ description: "The note body in Markdown" }),
      tags: Type.Optional(Type.Array(Type.String(), { description: "Optional tags" })),
    }),
    execute: async (_id, raw) => {
      const p = raw as P;
      const title = p.title as string;
      const body = p.body as string;
      const tags = (p.tags as string[] | undefined) ?? [];
      const dirHandle = directoryHandle.value;
      if (!dirHandle) return err("No directory open.");

      const now = new Date();
      const id = formatTimestampId(now);
      const filename = generateFilename(now, title);

      const frontMatter = { title, date: now.toISOString().replace("Z", ""), tags };
      const content = serializeFrontMatter(frontMatter, body + "\n");

      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      await writeFile(fileHandle, content);

      const file = await fileHandle.getFile();
      const note: Note = {
        id, title, tags, filename, fileHandle,
        lastModified: file.lastModified, size: file.size,
        isNotiFormat: true, createdAt: now,
      };

      upsertNote(note);
      addToIndex({ id: note.id, title, tags, body });
      return text(`Created note "${title}" (ID: ${id})`);
    },
  };

  const editNote: AgentTool = {
    name: "edit_note",
    label: "Edit Note",
    description: "Replace a note's body content. Preserves frontmatter.",
    parameters: Type.Object({
      noteId: Type.String({ description: "The note ID to edit" }),
      body: Type.String({ description: "The new body content in Markdown" }),
    }),
    execute: async (_id, raw) => {
      const p = raw as P;
      const noteId = p.noteId as string;
      const body = p.body as string;
      const note = getNote(noteId);
      if (!note) return err(`Note "${noteId}" not found.`);

      const rawContent = await readNoteContent(note.fileHandle);
      const { frontMatter } = parseFrontMatter(rawContent);
      const content = serializeFrontMatter(frontMatter, body + "\n");
      await writeFile(note.fileHandle, content);

      const file = await note.fileHandle.getFile();
      upsertNote({ ...note, lastModified: file.lastModified, size: file.size });
      updateInIndex({ id: note.id, title: note.title, tags: note.tags, body });
      return text(`Updated note "${note.title}" (ID: ${noteId})`);
    },
  };

  const deleteNote: AgentTool = {
    name: "delete_note",
    label: "Delete Note",
    description: "Delete a note by its ID.",
    parameters: Type.Object({
      noteId: Type.String({ description: "The note ID to delete" }),
    }),
    execute: async (_id, raw) => {
      const p = raw as P;
      const noteId = p.noteId as string;
      const dirHandle = directoryHandle.value;
      if (!dirHandle) return err("No directory open.");

      const note = getNote(noteId);
      if (!note) return err(`Note "${noteId}" not found.`);

      await dirHandle.removeEntry(note.filename);
      removeNote(noteId);
      removeFromIndex(noteId);
      return text(`Deleted note "${note.title}" (ID: ${noteId})`);
    },
  };

  const searchNotes: AgentTool = {
    name: "search_notes",
    label: "Search Notes",
    description: "Full-text search across all notes. Returns top 10 results with IDs and titles.",
    parameters: Type.Object({
      query: Type.String({ description: "The search query" }),
    }),
    execute: async (_id, raw) => {
      const p = raw as P;
      const query = p.query as string;
      const results = queryIndex(query).slice(0, 10);
      if (results.length === 0) return text("No results found.");
      const lines = results.map(
        (r) => `- ${r.title} (ID: ${r.id}, score: ${r.score.toFixed(2)})`,
      );
      return text(lines.join("\n"));
    },
  };

  const listNotes: AgentTool = {
    name: "list_notes",
    label: "List Notes",
    description: "List notes, optionally filtered by a tag. Returns summaries with IDs and titles.",
    parameters: Type.Object({
      tag: Type.Optional(Type.String({ description: "Optional tag to filter by" })),
    }),
    execute: async (_id, raw) => {
      const p = raw as P;
      const tag = p.tag as string | undefined;
      const notes: Note[] = [];
      for (const note of notesMap.value.values()) {
        if (tag && !note.tags.includes(tag)) continue;
        notes.push(note);
      }
      notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (notes.length === 0) {
        return text(tag ? `No notes with tag "${tag}".` : "No notes found.");
      }

      const lines = notes.slice(0, 50).map((n) => {
        const tagStr = n.tags.length > 0 ? ` [${n.tags.join(", ")}]` : "";
        return `- ${n.title} (ID: ${n.id})${tagStr}`;
      });
      if (notes.length > 50) lines.push(`... and ${notes.length - 50} more`);
      return text(lines.join("\n"));
    },
  };

  const runJavascript: AgentTool = {
    name: "run_javascript",
    label: "Run JavaScript",
    description:
      "Execute JavaScript code in the browser. The code runs in the page context with full access to browser APIs: document, window, fetch, localStorage, navigator, Canvas, Web Audio, and all other Web APIs. Supports async/await. Simple expressions (e.g. `crypto.randomUUID()`) auto-return their value. For multi-statement code, use `return` to return a value.",
    parameters: Type.Object({
      code: Type.String({ description: "JavaScript code to execute" }),
    }),
    execute: async (_id, raw) => {
      const p = raw as P;
      const code = p.code as string;
      try {
        // Try as expression first (like a REPL) — handles `crypto.randomUUID()`, `1+1`, etc.
        const exprFn = new Function(`return (async () => { return (${code}); })();`);
        const result = await exprFn();
        return text(String(result ?? "undefined"));
      } catch {
        // Fall back to statement mode — handles multi-line code with `return`
        try {
          const stmtFn = new Function(`return (async () => { ${code} })();`);
          const result = await stmtFn();
          return text(String(result ?? "undefined"));
        } catch (e) {
          return err(`Error: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    },
  };

  return [readNote, createNote, editNote, deleteNote, searchNotes, listNotes, runJavascript];
}
