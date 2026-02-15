import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebDavBackend } from "./webdav-backend.ts";
import { WebDavError } from "./webdav-error.ts";

const CONFIG = { url: "http://localhost:8080/webdav", username: "noti", password: "notidev" };

const PROPFIND_LIST_RESPONSE = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/webdav/</D:href>
    <D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat>
  </D:response>
  <D:response>
    <D:href>/webdav/note.md</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype/>
        <D:getlastmodified>Wed, 22 Mar 2024 13:18:56 GMT</D:getlastmodified>
        <D:getcontentlength>100</D:getcontentlength>
      </D:prop>
    </D:propstat>
  </D:response>
</D:multistatus>`;

const PROPFIND_SINGLE_RESPONSE = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/webdav/note.md</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype/>
        <D:getlastmodified>Wed, 22 Mar 2024 13:18:56 GMT</D:getlastmodified>
        <D:getcontentlength>200</D:getcontentlength>
      </D:prop>
    </D:propstat>
  </D:response>
</D:multistatus>`;

function mockResponse(body: string, status = 200, statusText = "OK"): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: () => Promise.resolve(body),
    blob: () => Promise.resolve(new Blob([body])),
    headers: new Headers(),
  } as unknown as Response;
}

describe("WebDavBackend", () => {
  const mockFetch = vi.fn() as unknown as ReturnType<typeof vi.fn> & typeof globalThis.fetch;

  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as typeof globalThis.fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("has type webdav", () => {
    const backend = new WebDavBackend(CONFIG);
    expect(backend.type).toBe("webdav");
  });

  it("derives name from URL hostname", () => {
    const backend = new WebDavBackend(CONFIG);
    expect(backend.name).toBe("localhost");
  });

  it("normalizes URL with trailing slash", () => {
    const backend = new WebDavBackend(CONFIG);
    mockFetch.mockResolvedValueOnce(mockResponse(PROPFIND_LIST_RESPONSE, 207));
    backend.list();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/webdav/",
      expect.objectContaining({ method: "PROPFIND" }),
    );
  });

  describe("list()", () => {
    it("sends PROPFIND with Depth:1 and returns file entries", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse(PROPFIND_LIST_RESPONSE, 207));

      const entries = await backend.list();

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/webdav/",
        expect.objectContaining({
          method: "PROPFIND",
          headers: expect.objectContaining({
            Depth: "1",
            Authorization: expect.stringContaining("Basic"),
          }),
        }),
      );
      expect(entries).toHaveLength(1);
      expect(entries[0].filename).toBe("note.md");
      expect(entries[0].size).toBe(100);
    });
  });

  describe("read()", () => {
    it("sends GET with auth header", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse("# Hello"));

      const content = await backend.read("note.md");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/webdav/note.md",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic"),
          }),
        }),
      );
      expect(content).toBe("# Hello");
    });
  });

  describe("write()", () => {
    it("sends PUT then PROPFIND and returns metadata", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch
        .mockResolvedValueOnce(mockResponse("", 201))
        .mockResolvedValueOnce(mockResponse(PROPFIND_SINGLE_RESPONSE, 207));

      const meta = await backend.write("note.md", "# Hello");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect((mockFetch.mock.calls[0]![1] as RequestInit).method).toBe("PUT");
      expect((mockFetch.mock.calls[1]![1] as RequestInit).method).toBe("PROPFIND");
      expect(meta.size).toBe(200);
    });
  });

  describe("delete()", () => {
    it("sends DELETE request", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse("", 204));

      await backend.delete("note.md");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/webdav/note.md",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
  });

  describe("writeBinary()", () => {
    it("sends MKCOL then PUT", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch
        .mockResolvedValueOnce(mockResponse("", 201)) // MKCOL
        .mockResolvedValueOnce(mockResponse("", 201)); // PUT

      await backend.writeBinary(".attachments", "image.png", new Blob(["data"]));

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect((mockFetch.mock.calls[0]![1] as RequestInit).method).toBe("MKCOL");
      expect((mockFetch.mock.calls[1]![1] as RequestInit).method).toBe("PUT");
    });

    it("ignores 405 from MKCOL (dir already exists)", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch
        .mockResolvedValueOnce(mockResponse("", 405, "Method Not Allowed"))
        .mockResolvedValueOnce(mockResponse("", 201));

      await expect(
        backend.writeBinary(".attachments", "image.png", new Blob(["data"])),
      ).resolves.toBeUndefined();
    });
  });

  describe("deleteDir()", () => {
    it("silently handles 404", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse("", 404, "Not Found"));

      await expect(backend.deleteDir(".attachments")).resolves.toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("wraps TypeError as CORS error", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      try {
        await backend.read("note.md");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(WebDavError);
        expect((e as WebDavError).isCorsError()).toBe(true);
      }
    });

    it("wraps 401 response as auth error", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse("", 401, "Unauthorized"));

      try {
        await backend.read("note.md");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(WebDavError);
        expect((e as WebDavError).isAuthError()).toBe(true);
      }
    });

    it("wraps 404 response as not found error", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse("", 404, "Not Found"));

      try {
        await backend.read("note.md");
        expect.fail("Should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(WebDavError);
        expect((e as WebDavError).isNotFound()).toBe(true);
      }
    });
  });

  describe("getMetadata()", () => {
    it("sends PROPFIND Depth:0 and returns lastModified and size", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse(PROPFIND_SINGLE_RESPONSE, 207));

      const meta = await backend.getMetadata("note.md");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/webdav/note.md",
        expect.objectContaining({
          method: "PROPFIND",
          headers: expect.objectContaining({ Depth: "0" }),
        }),
      );
      expect(meta.size).toBe(200);
      expect(meta.lastModified).toBe(new Date("Wed, 22 Mar 2024 13:18:56 GMT").getTime());
    });
  });

  describe("listDir()", () => {
    it("sends PROPFIND to dir path and returns file entries", async () => {
      const dirResponse = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/webdav/.attachments/</D:href>
    <D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat>
  </D:response>
  <D:response>
    <D:href>/webdav/.attachments/image.png</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype/>
        <D:getlastmodified>Thu, 01 Jan 2024 00:00:00 GMT</D:getlastmodified>
        <D:getcontentlength>500</D:getcontentlength>
      </D:prop>
    </D:propstat>
  </D:response>
</D:multistatus>`;
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse(dirResponse, 207));

      const entries = await backend.listDir(".attachments");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/webdav/.attachments/",
        expect.objectContaining({ method: "PROPFIND" }),
      );
      expect(entries).toHaveLength(1);
      expect(entries[0].filename).toBe("image.png");
      expect(entries[0].size).toBe(500);
    });

    it("returns empty array on 404", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse("", 404, "Not Found"));

      const entries = await backend.listDir(".nonexistent");
      expect(entries).toEqual([]);
    });

    it("rethrows non-404 errors", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse("", 500, "Internal Server Error"));

      await expect(backend.listDir(".attachments")).rejects.toThrow(WebDavError);
    });
  });

  describe("readFromDir()", () => {
    it("sends GET to dir/filename path", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse('{"key": "value"}'));

      const content = await backend.readFromDir(".noti", "favorites.json");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/webdav/.noti/favorites.json",
        expect.objectContaining({ method: "GET" }),
      );
      expect(content).toBe('{"key": "value"}');
    });
  });

  describe("writeToDir()", () => {
    it("sends MKCOL then PUT with text content", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch
        .mockResolvedValueOnce(mockResponse("", 201)) // MKCOL
        .mockResolvedValueOnce(mockResponse("", 201)); // PUT

      await backend.writeToDir(".noti", "favorites.json", '{"ids":[]}');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect((mockFetch.mock.calls[0]![1] as RequestInit).method).toBe("MKCOL");
      expect((mockFetch.mock.calls[1]![1] as RequestInit).method).toBe("PUT");
      expect((mockFetch.mock.calls[1]![1] as RequestInit).body).toBe('{"ids":[]}');
    });
  });

  describe("readBinaryURL()", () => {
    it("sends GET and returns object URL from blob", async () => {
      const backend = new WebDavBackend(CONFIG);
      const fakeBlob = new Blob(["image data"]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        blob: () => Promise.resolve(fakeBlob),
        headers: new Headers(),
      } as unknown as Response);

      const url = await backend.readBinaryURL(".attachments", "image.png");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/webdav/.attachments/image.png",
        expect.objectContaining({ method: "GET" }),
      );
      // URL.createObjectURL returns "blob:..." in jsdom
      expect(url).toContain("blob:");
    });
  });

  describe("disconnect()", () => {
    it("clears metadata cache", async () => {
      const backend = new WebDavBackend(CONFIG);
      // Populate cache via list()
      mockFetch.mockResolvedValueOnce(mockResponse(PROPFIND_LIST_RESPONSE, 207));
      await backend.list();

      backend.disconnect();

      // After disconnect, getMetadata should fetch fresh (no cache)
      mockFetch.mockResolvedValueOnce(mockResponse(PROPFIND_SINGLE_RESPONSE, 207));
      const meta = await backend.getMetadata("note.md");
      expect(meta.size).toBe(200);
    });
  });

  describe("deleteDir()", () => {
    it("sends DELETE with trailing slash", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse("", 204));

      await backend.deleteDir(".attachments");

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8080/webdav/.attachments/",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("rethrows non-404 errors", async () => {
      const backend = new WebDavBackend(CONFIG);
      mockFetch.mockResolvedValueOnce(mockResponse("", 500, "Internal Server Error"));

      await expect(backend.deleteDir(".attachments")).rejects.toThrow(WebDavError);
    });
  });

  describe("name fallback", () => {
    it("falls back to 'WebDAV' for invalid URL", () => {
      const backend = new WebDavBackend({ url: "not-a-url", username: "u", password: "p" });
      expect(backend.name).toBe("WebDAV");
    });
  });

  describe("onExternalChange", () => {
    it("is undefined (WebDAV has no native change events)", () => {
      const backend = new WebDavBackend(CONFIG);
      expect(backend.onExternalChange).toBeUndefined();
    });
  });
});
