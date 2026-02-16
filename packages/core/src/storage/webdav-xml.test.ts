import { describe, it, expect } from "vitest";
import { parsePropfindResponse, hrefToFilename } from "./webdav-xml.ts";

const MULTISTATUS_XML = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/webdav/</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  <D:response>
    <D:href>/webdav/20240322T131856--meeting-notes.md</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype/>
        <D:getlastmodified>Wed, 22 Mar 2024 13:18:56 GMT</D:getlastmodified>
        <D:getcontentlength>1234</D:getcontentlength>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  <D:response>
    <D:href>/webdav/20240401T100000--recipe.md</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype/>
        <D:getlastmodified>Mon, 01 Apr 2024 10:00:00 GMT</D:getlastmodified>
        <D:getcontentlength>567</D:getcontentlength>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
  <D:response>
    <D:href>/webdav/.attachments/</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;

describe("webdav-xml", () => {
  describe("parsePropfindResponse", () => {
    it("parses valid multistatus XML with multiple files", () => {
      const entries = parsePropfindResponse(MULTISTATUS_XML, "http://localhost:8080/webdav/");
      // Should filter out the base collection (/webdav/) and the .attachments/ collection
      const files = entries.filter((e) => !e.isCollection);
      expect(files).toHaveLength(2);
      expect(files[0].lastModified).toBeGreaterThan(0);
      expect(files[0].size).toBe(1234);
      expect(files[1].size).toBe(567);
    });

    it("filters out the base collection", () => {
      const entries = parsePropfindResponse(MULTISTATUS_XML, "http://localhost:8080/webdav/");
      // The base /webdav/ collection should be filtered out
      const baseEntries = entries.filter((e) => e.href.replace(/\/$/, "") === "/webdav");
      expect(baseEntries).toHaveLength(0);
    });

    it("identifies collections (directories)", () => {
      const entries = parsePropfindResponse(MULTISTATUS_XML, "http://localhost:8080/webdav/");
      const collections = entries.filter((e) => e.isCollection);
      expect(collections).toHaveLength(1);
      expect(collections[0].href).toContain(".attachments");
    });

    it("handles URL-encoded hrefs", () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/webdav/</D:href>
    <D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat>
  </D:response>
  <D:response>
    <D:href>/webdav/my%20note%20%28draft%29.md</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype/>
        <D:getlastmodified>Wed, 22 Mar 2024 13:18:56 GMT</D:getlastmodified>
        <D:getcontentlength>100</D:getcontentlength>
      </D:prop>
    </D:propstat>
  </D:response>
</D:multistatus>`;
      const entries = parsePropfindResponse(xml, "http://localhost:8080/webdav/");
      const files = entries.filter((e) => !e.isCollection);
      expect(files).toHaveLength(1);
      expect(files[0].href).toContain("my note (draft).md");
    });

    it("handles missing properties with defaults", () => {
      const xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">
  <D:response>
    <D:href>/webdav/</D:href>
    <D:propstat><D:prop><D:resourcetype><D:collection/></D:resourcetype></D:prop></D:propstat>
  </D:response>
  <D:response>
    <D:href>/webdav/note.md</D:href>
    <D:propstat>
      <D:prop><D:resourcetype/></D:prop>
    </D:propstat>
  </D:response>
</D:multistatus>`;
      const entries = parsePropfindResponse(xml, "http://localhost:8080/webdav/");
      const files = entries.filter((e) => !e.isCollection);
      expect(files).toHaveLength(1);
      expect(files[0].lastModified).toBe(0);
      expect(files[0].size).toBe(0);
    });

    it("throws on malformed XML", () => {
      expect(() =>
        parsePropfindResponse("not xml at all", "http://localhost/"),
      ).toThrow("Malformed XML");
    });
  });

  describe("hrefToFilename", () => {
    it("extracts filename from a full href path", () => {
      expect(hrefToFilename("/webdav/my-note.md")).toBe("my-note.md");
    });

    it("handles trailing slashes (directories)", () => {
      expect(hrefToFilename("/webdav/subdir/")).toBe("subdir");
    });

    it("handles just a filename", () => {
      expect(hrefToFilename("note.md")).toBe("note.md");
    });
  });
});
