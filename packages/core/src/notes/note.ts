export interface Note {
  /** YYYYMMDDTHHMMSS (immutable, from filename) or raw filename for plain .md files. */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Tags from front matter. */
  tags: string[];
  /** Arbitrary frontmatter properties beyond title/date/tags. */
  properties: Record<string, string>;
  /** Full filename on disk. */
  filename: string;
  /** Last modified timestamp for conflict detection. */
  lastModified: number;
  /** File size in bytes. */
  size: number;
  /** Whether this file follows the YYYYMMDDTHHMMSS--slug.md naming convention. */
  isTimestampFormat: boolean;
  /** Creation date parsed from the ID. */
  createdAt: Date;
}
