import { slugify } from "../lib/slug.ts";
import { formatTimestampId } from "../lib/date.ts";

export interface ParsedFilename {
  id: string;
  titleSlug: string | null;
  isTimestampFormat: boolean;
}

const TIMESTAMP_FILENAME_RE = /^(\d{8}T\d{6})(?:--(.+))?\.md$/;

/** Parse a filename into its ID and title slug components. */
export function parseFilename(filename: string): ParsedFilename | null {
  if (!filename.endsWith(".md")) return null;

  const match = filename.match(TIMESTAMP_FILENAME_RE);
  if (match) {
    return {
      id: match[1],
      titleSlug: match[2] || null,
      isTimestampFormat: true,
    };
  }

  // Plain .md file: use raw filename (without .md) as identifier
  return {
    id: filename,
    titleSlug: null,
    isTimestampFormat: false,
  };
}

/** Convert a title slug back to a human-readable title. */
export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Generate a timestamp filename from a date and title. */
export function generateFilename(date: Date, title: string): string {
  const id = formatTimestampId(date);
  const slug = slugify(title);
  if (!slug) return `${id}.md`;
  return `${id}--${slug}.md`;
}
