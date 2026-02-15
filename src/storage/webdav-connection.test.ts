import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { testWebDavConnection } from "./webdav-connection.ts";

describe("testWebDavConnection", () => {
  const mockFetch = vi.fn() as unknown as ReturnType<typeof vi.fn> & typeof globalThis.fetch;

  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as typeof globalThis.fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok:true on 207 Multi-Status", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 207, statusText: "Multi-Status" });
    const result = await testWebDavConnection("http://localhost:8080/", "user", "pass");
    expect(result).toEqual({ ok: true });
  });

  it("returns ok:true on 200 OK", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" });
    const result = await testWebDavConnection("http://localhost:8080/", "user", "pass");
    expect(result).toEqual({ ok: true });
  });

  it("returns auth error on 401", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, statusText: "Unauthorized" });
    const result = await testWebDavConnection("http://localhost:8080/", "user", "wrong");
    expect(result).toEqual({ ok: false, error: "auth" });
  });

  it("returns auth error on 403", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, statusText: "Forbidden" });
    const result = await testWebDavConnection("http://localhost:8080/", "user", "pass");
    expect(result).toEqual({ ok: false, error: "auth" });
  });

  it("returns not_found error on 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, statusText: "Not Found" });
    const result = await testWebDavConnection("http://badhost/missing/", "user", "pass");
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("returns cors error on TypeError", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const result = await testWebDavConnection("http://localhost:8080/", "user", "pass");
    expect(result).toEqual({ ok: false, error: "cors" });
  });

  it("returns generic error string on non-TypeError exception", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network down"));
    const result = await testWebDavConnection("http://localhost:8080/", "user", "pass");
    expect(result).toEqual({ ok: false, error: "Error: Network down" });
  });

  it("returns server error message on 500", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: "Internal Server Error" });
    const result = await testWebDavConnection("http://localhost:8080/", "user", "pass");
    expect(result).toEqual({ ok: false, error: "Server returned 500 Internal Server Error" });
  });

  it("sends PROPFIND with Depth:0 and Basic auth", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" });
    await testWebDavConnection("http://localhost:8080/webdav", "noti", "notidev");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/webdav/",
      expect.objectContaining({
        method: "PROPFIND",
        headers: expect.objectContaining({
          Depth: "0",
          Authorization: "Basic " + btoa("noti:notidev"),
        }),
      }),
    );
  });

  it("normalizes URL by appending trailing slash", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" });
    await testWebDavConnection("http://localhost:8080/webdav", "user", "pass");
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/webdav/", expect.anything());
  });

  it("does not double trailing slash if already present", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" });
    await testWebDavConnection("http://localhost:8080/webdav/", "user", "pass");
    expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/webdav/", expect.anything());
  });
});
