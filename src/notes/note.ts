export interface Note {
  /** YYYYMMDDTHHMMSS (immutable, from filename) or raw filename for non-Noti files. */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Tags from front matter. */
  tags: string[];
  /** Full filename on disk. */
  filename: string;
  /** Last modified timestamp for conflict detection. */
  lastModified: number;
  /** File size in bytes. */
  size: number;
  /** Whether this file follows Noti naming convention. */
  isNotiFormat: boolean;
  /** Creation date parsed from the ID. */
  createdAt: Date;
}
