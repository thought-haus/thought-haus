import { describe, it, expect, vi, afterEach } from "vitest";
import { isFileSystemAccessSupported } from "./browser.ts";

describe("isFileSystemAccessSupported", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when showDirectoryPicker exists", () => {
    vi.stubGlobal("showDirectoryPicker", vi.fn());
    expect(isFileSystemAccessSupported()).toBe(true);
  });

  it("returns false when showDirectoryPicker is undefined", () => {
    vi.stubGlobal("showDirectoryPicker", undefined);
    expect(isFileSystemAccessSupported()).toBe(false);
  });
});
