import type { StorageBackend, FileEntry, FileMeta } from "./backend.ts";

export class LocalBackend implements StorageBackend {
  readonly type = "local" as const;
  readonly name: string;
  private dirHandle: FileSystemDirectoryHandle;
  private handleCache = new Map<string, FileSystemFileHandle>();

  constructor(dirHandle: FileSystemDirectoryHandle) {
    this.dirHandle = dirHandle;
    this.name = dirHandle.name;
  }

  async list(): Promise<FileEntry[]> {
    const entries: FileEntry[] = [];
    this.handleCache.clear();

    for await (const [name, handle] of this.dirHandle.entries()) {
      if (handle.kind !== "file") continue;
      const fileHandle = handle as FileSystemFileHandle;
      this.handleCache.set(name, fileHandle);
      const file = await fileHandle.getFile();
      entries.push({
        filename: name,
        lastModified: file.lastModified,
        size: file.size,
      });
    }

    return entries;
  }

  async read(filename: string): Promise<string> {
    const handle = await this.resolveHandle(filename);
    const file = await handle.getFile();
    return file.text();
  }

  async write(filename: string, content: string): Promise<FileMeta> {
    let handle = this.handleCache.get(filename);
    if (!handle) {
      handle = await this.dirHandle.getFileHandle(filename, { create: true });
      this.handleCache.set(filename, handle);
    }
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    const file = await handle.getFile();
    return { lastModified: file.lastModified, size: file.size };
  }

  async delete(filename: string): Promise<void> {
    await this.dirHandle.removeEntry(filename);
    this.handleCache.delete(filename);
  }

  async getMetadata(filename: string): Promise<FileMeta> {
    const handle = await this.resolveHandle(filename);
    const file = await handle.getFile();
    return { lastModified: file.lastModified, size: file.size };
  }

  disconnect(): void {
    this.handleCache.clear();
  }

  onExternalChange(callback: () => void): () => void {
    if (typeof FileSystemObserver === "undefined") {
      return () => {};
    }
    try {
      const observer = new FileSystemObserver(callback);
      observer.observe(this.dirHandle);
      return () => observer.disconnect();
    } catch {
      return () => {};
    }
  }

  /** Expose raw handle for IndexedDB persistence and permission checks. */
  getRawHandle(): FileSystemDirectoryHandle {
    return this.dirHandle;
  }

  private async resolveHandle(filename: string): Promise<FileSystemFileHandle> {
    const cached = this.handleCache.get(filename);
    if (cached) return cached;
    const handle = await this.dirHandle.getFileHandle(filename);
    this.handleCache.set(filename, handle);
    return handle;
  }
}
