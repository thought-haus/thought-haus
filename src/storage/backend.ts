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
  readonly type: "local";
  readonly name: string;

  list(): Promise<FileEntry[]>;
  read(filename: string): Promise<string>;
  write(filename: string, content: string): Promise<FileMeta>;
  delete(filename: string): Promise<void>;
  getMetadata(filename: string): Promise<FileMeta>;
  disconnect(): void;

  /** Optional: native FS change events (e.g. FileSystemObserver). Returns cleanup. */
  onExternalChange?(callback: () => void): () => void;
}
