import { describe, it, expect } from "vitest";
import { parseFilename, slugToTitle, generateFilename } from "./filename.ts";

describe("parseFilename", () => {
  it("parses a standard Noti filename", () => {
    const result = parseFilename("20240322T131856--meeting-notes.md");
    expect(result).toEqual({
      id: "20240322T131856",
      titleSlug: "meeting-notes",
      isNotiFormat: true,
    });
  });

  it("parses an untitled Noti file", () => {
    const result = parseFilename("20240322T131856.md");
    expect(result).toEqual({
      id: "20240322T131856",
      titleSlug: null,
      isNotiFormat: true,
    });
  });

  it("parses a non-Noti .md file", () => {
    const result = parseFilename("README.md");
    expect(result).toEqual({
      id: "README.md",
      titleSlug: null,
      isNotiFormat: false,
    });
  });

  it("returns null for non-.md files", () => {
    expect(parseFilename("notes.txt")).toBeNull();
    expect(parseFilename("photo.jpg")).toBeNull();
  });

  it("handles complex title slugs", () => {
    const result = parseFilename(
      "20240101T000000--my-long-note-title.md",
    );
    expect(result).toEqual({
      id: "20240101T000000",
      titleSlug: "my-long-note-title",
      isNotiFormat: true,
    });
  });
});

describe("slugToTitle", () => {
  it("converts slug to title case", () => {
    expect(slugToTitle("meeting-notes")).toBe("Meeting Notes");
  });

  it("handles single word", () => {
    expect(slugToTitle("hello")).toBe("Hello");
  });
});

describe("generateFilename", () => {
  it("generates filename with title", () => {
    const date = new Date(2024, 2, 22, 13, 18, 56);
    expect(generateFilename(date, "Meeting Notes")).toBe(
      "20240322T131856--meeting-notes.md",
    );
  });

  it("generates filename without title", () => {
    const date = new Date(2024, 2, 22, 13, 18, 56);
    expect(generateFilename(date, "")).toBe("20240322T131856.md");
  });

  it("strips special characters from title", () => {
    const date = new Date(2024, 0, 1, 0, 0, 0);
    expect(generateFilename(date, "What's Up?")).toBe(
      "20240101T000000--whats-up.md",
    );
  });
});
