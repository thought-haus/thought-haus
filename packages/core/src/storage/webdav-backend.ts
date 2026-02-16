import type { StorageBackend, FileEntry, FileMeta } from "./backend.ts";
import { parsePropfindResponse, hrefToFilename } from "./webdav-xml.ts";
import { WebDavError } from "./webdav-error.ts";

export interface WebDavConfig {
  url: string;
  username: string;
  password: string;
}

export class WebDavBackend implements StorageBackend {
  readonly type = "webdav" as const;
  readonly name: string;
  private baseUrl: string;
  private authHeader: string;
  private metadataCache = new Map<string, { lastModified: number; size: number }>();

  constructor(config: WebDavConfig) {
    this.baseUrl = config.url.endsWith("/") ? config.url : config.url + "/";
    this.authHeader = "Basic " + btoa(config.username + ":" + config.password);
    // Derive a display name from the URL
    try {
      const url = new URL(this.baseUrl);
      this.name = url.hostname;
    } catch {
      this.name = "WebDAV";
    }
  }

  async list(): Promise<FileEntry[]> {
    const xml = await this.propfind(this.baseUrl, "1");
    const entries = parsePropfindResponse(xml, this.baseUrl);

    this.metadataCache.clear();
    const files: FileEntry[] = [];
    for (const entry of entries) {
      if (entry.isCollection) continue;
      const filename = hrefToFilename(entry.href);
      this.metadataCache.set(filename, {
        lastModified: entry.lastModified,
        size: entry.size,
      });
      files.push({
        filename,
        lastModified: entry.lastModified,
        size: entry.size,
      });
    }
    return files;
  }

  async read(filename: string): Promise<string> {
    const response = await this.fetch(this.baseUrl + encodeURIComponent(filename), {
      method: "GET",
    });
    return response.text();
  }

  async write(filename: string, content: string): Promise<FileMeta> {
    await this.fetch(this.baseUrl + encodeURIComponent(filename), {
      method: "PUT",
      body: content,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });

    // Get server's metadata for the written file
    const meta = await this.getMetadata(filename);
    this.metadataCache.set(filename, meta);
    return meta;
  }

  async delete(filename: string): Promise<void> {
    await this.fetch(this.baseUrl + encodeURIComponent(filename), {
      method: "DELETE",
    });
    this.metadataCache.delete(filename);
  }

  async getMetadata(filename: string): Promise<FileMeta> {
    const xml = await this.propfind(
      this.baseUrl + encodeURIComponent(filename),
      "0",
    );
    // For Depth:0, parsePropfindResponse filters the base, so use parsePropfindSingle
    const meta = this.parsePropfindSingle(xml);
    this.metadataCache.set(filename, meta);
    return meta;
  }

  async writeBinary(dir: string, filename: string, data: Blob): Promise<void> {
    await this.ensureDir(dir);
    await this.fetch(this.baseUrl + encodeURIComponent(dir) + "/" + encodeURIComponent(filename), {
      method: "PUT",
      body: data,
    });
  }

  async readBinaryURL(dir: string, filename: string): Promise<string> {
    const response = await this.fetch(
      this.baseUrl + encodeURIComponent(dir) + "/" + encodeURIComponent(filename),
      { method: "GET" },
    );
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async listDir(dir: string): Promise<FileEntry[]> {
    try {
      const url = this.baseUrl + encodeURIComponent(dir) + "/";
      const xml = await this.propfind(url, "1");
      const entries = parsePropfindResponse(xml, url);
      return entries
        .filter((e) => !e.isCollection)
        .map((e) => ({
          filename: hrefToFilename(e.href),
          lastModified: e.lastModified,
          size: e.size,
        }));
    } catch (err) {
      if (err instanceof WebDavError && err.isNotFound()) {
        return [];
      }
      throw err;
    }
  }

  async deleteDir(dir: string): Promise<void> {
    try {
      await this.fetch(this.baseUrl + encodeURIComponent(dir) + "/", {
        method: "DELETE",
      });
    } catch (err) {
      if (err instanceof WebDavError && err.isNotFound()) {
        return;
      }
      throw err;
    }
  }

  async readFromDir(dir: string, filename: string): Promise<string> {
    const response = await this.fetch(
      this.baseUrl + encodeURIComponent(dir) + "/" + encodeURIComponent(filename),
      { method: "GET" },
    );
    return response.text();
  }

  async writeToDir(dir: string, filename: string, content: string): Promise<void> {
    await this.ensureDir(dir);
    await this.fetch(
      this.baseUrl + encodeURIComponent(dir) + "/" + encodeURIComponent(filename),
      {
        method: "PUT",
        body: content,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }

  disconnect(): void {
    this.metadataCache.clear();
  }

  // WebDAV has no native change events — polling only
  onExternalChange?: undefined;

  private async fetch(
    url: string,
    init: RequestInit & { headers?: Record<string, string> },
  ): Promise<Response> {
    const headers = { ...init.headers, Authorization: this.authHeader };
    let response: Response;
    try {
      response = await globalThis.fetch(url, { ...init, headers });
    } catch (err) {
      if (err instanceof TypeError) {
        throw WebDavError.fromCorsError(err);
      }
      throw err;
    }
    if (!response.ok && response.status !== 207) {
      throw WebDavError.fromResponse(response);
    }
    return response;
  }

  private async propfind(url: string, depth: string): Promise<string> {
    const response = await this.fetch(url, {
      method: "PROPFIND",
      headers: {
        Depth: depth,
        "Content-Type": "application/xml",
      },
      body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><allprop/></propfind>',
    });
    return response.text();
  }

  private async ensureDir(dir: string): Promise<void> {
    try {
      await this.fetch(this.baseUrl + encodeURIComponent(dir) + "/", {
        method: "MKCOL",
      });
    } catch (err) {
      // 405 = directory already exists, which is fine
      if (err instanceof WebDavError && err.status === 405) return;
      throw err;
    }
  }

  /** Parse a Depth:0 PROPFIND response to get metadata for the single resource. */
  private parsePropfindSingle(xmlText: string): FileMeta {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");

    const lastModEl = doc.getElementsByTagNameNS("DAV:", "getlastmodified")[0];
    const lastModified = lastModEl?.textContent
      ? new Date(lastModEl.textContent).getTime()
      : Date.now();

    const sizeEl = doc.getElementsByTagNameNS("DAV:", "getcontentlength")[0];
    const size = sizeEl?.textContent ? parseInt(sizeEl.textContent, 10) : 0;

    return { lastModified, size };
  }
}
