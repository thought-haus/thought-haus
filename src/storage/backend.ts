export interface FileEntry {
  filename: string;
  lastModified: number;
  size: number;
}

export interface FileMeta {
  lastModified: number;
  size: number;
}

export interface StorageBackend {
  readonly type: "local" | "webdav";
  readonly name: string;

  list(): Promise<FileEntry[]>;
  read(filename: string): Promise<string>;
  write(filename: string, content: string): Promise<FileMeta>;
  delete(filename: string): Promise<void>;
  getMetadata(filename: string): Promise<FileMeta>;
  disconnect(): void;

  /** Write a binary blob into a subdirectory. */
  writeBinary(dir: string, filename: string, data: Blob): Promise<void>;
  /** Get an object URL for a binary file in a subdirectory. */
  readBinaryURL(dir: string, filename: string): Promise<string>;
  /** List entries in a subdirectory (returns [] if dir doesn't exist). */
  listDir(dir: string): Promise<FileEntry[]>;
  /** Recursively delete a subdirectory. Silently no-ops if not found. */
  deleteDir(dir: string): Promise<void>;

  /** Read a text file from a subdirectory. */
  readFromDir(dir: string, filename: string): Promise<string>;
  /** Write a text file to a subdirectory (creates dir if needed). */
  writeToDir(dir: string, filename: string, content: string): Promise<void>;

  /** Optional: native FS change events (e.g. FileSystemObserver). Returns cleanup. */
  onExternalChange?(callback: () => void): () => void;
}
