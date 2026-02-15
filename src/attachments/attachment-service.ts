import { storageBackend } from "../lib/app-state.ts";
import { formatTimestampId } from "../lib/date.ts";
import { slugify } from "../lib/slug.ts";
import type { Note } from "../notes/note.ts";

const IMAGE_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico",
]);

/** Check if a filename refers to an image by extension. */
export function isImageFile(filename: string): boolean {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return false;
  return IMAGE_EXTS.has(filename.slice(dot).toLowerCase());
}

/** Get the attachment subdirectory name for a note. */
export function getAttachmentDir(note: Note): string {
  return note.isTimestampFormat ? note.id : note.filename.replace(/\.md$/, "");
}

/** Generate a timestamped, slugified attachment filename. */
export function generateAttachmentFilename(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  const stem = dot > 0 ? originalName.slice(0, dot) : originalName;
  const ext = dot > 0 ? originalName.slice(dot) : "";
  const timestamp = formatTimestampId(new Date());
  const slug = slugify(stem) || "file";
  return `${timestamp}-${slug}${ext.toLowerCase()}`;
}

/** Save an attachment file for a note. Returns the relative markdown path and metadata. */
export async function saveAttachment(
  note: Note,
  file: File,
): Promise<{ relativePath: string; isImage: boolean; originalName: string }> {
  const backend = storageBackend.value;
  if (!backend) throw new Error("No storage backend");

  const dir = getAttachmentDir(note);
  const filename = generateAttachmentFilename(file.name);
  await backend.writeBinary(dir, filename, file);

  return {
    relativePath: `./${dir}/${filename}`,
    isImage: isImageFile(file.name),
    originalName: file.name,
  };
}

/** Get an object URL for an attachment file. Caller must revoke when done. */
export async function getAttachmentURL(
  dir: string,
  filename: string,
): Promise<string> {
  const backend = storageBackend.value;
  if (!backend) throw new Error("No storage backend");
  return backend.readBinaryURL(dir, filename);
}

/** Delete all attachments for a note. Best-effort, silently ignores missing dirs. */
export async function deleteNoteAttachments(note: Note): Promise<void> {
  const backend = storageBackend.value;
  if (!backend) return;
  await backend.deleteDir(getAttachmentDir(note));
}
