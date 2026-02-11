import { getNote } from "../notes/note-store.ts";

/** Regex matching [[YYYYMMDDTHHMMSS]] note links. */
export const NOTE_LINK_RE = /\[\[(\d{8}T\d{6})\]\]/g;

/** Parse all note link references from a string. */
export function parseNoteLinks(
  text: string,
): { id: string; start: number; end: number }[] {
  const links: { id: string; start: number; end: number }[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(NOTE_LINK_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    links.push({
      id: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return links;
}

/** Resolve a note link ID to a display label. */
export function resolveNoteLink(id: string): { title: string; exists: boolean } {
  const note = getNote(id);
  if (note) {
    return { title: note.title, exists: true };
  }
  return { title: id, exists: false };
}
