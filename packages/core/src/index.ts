// Notes
export type { Note } from "./notes/note.ts";
export type { FrontMatter } from "./notes/frontmatter.ts";
export { parseFrontMatter, serializeFrontMatter } from "./notes/frontmatter.ts";
export type { ParsedFilename } from "./notes/filename.ts";
export { parseFilename, slugToTitle, generateFilename } from "./notes/filename.ts";

// Storage
export type { StorageBackend, FileEntry, FileMeta } from "./storage/backend.ts";
export { LocalBackend } from "./storage/local-backend.ts";
export { WebDavBackend } from "./storage/webdav-backend.ts";
export type { WebDavConfig } from "./storage/webdav-backend.ts";
export { WebDavError } from "./storage/webdav-error.ts";
export type { PropfindEntry } from "./storage/webdav-xml.ts";
export { parsePropfindResponse, hrefToFilename } from "./storage/webdav-xml.ts";
export type { ConnectionResult } from "./storage/webdav-connection.ts";
export { testWebDavConnection } from "./storage/webdav-connection.ts";
export type { WebDavPersistedConfig } from "./storage/backend-persistence.ts";
export {
  saveWebDavConfig,
  loadWebDavConfig,
  saveActiveBackendType,
  loadActiveBackendType,
  clearBackendConfig,
} from "./storage/backend-persistence.ts";

// Lib
export { slugify } from "./lib/slug.ts";
export {
  formatTimestampId,
  parseTimestampId,
  formatDisplayDate,
  getDateGroup,
  getModifiedDateGroup,
} from "./lib/date.ts";
export { openDB } from "./lib/db.ts";
