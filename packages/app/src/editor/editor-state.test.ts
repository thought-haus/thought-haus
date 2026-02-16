import { describe, it, expect } from "vitest";
import { countWords } from "./editor-state.ts";

describe("countWords", () => {
  it("counts words in a normal string", () => {
    expect(countWords("hello world")).toBe(2);
  });

  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for whitespace only", () => {
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("handles multiple spaces between words", () => {
    expect(countWords("one  two   three")).toBe(3);
  });

  it("counts markdown content correctly", () => {
    expect(countWords("# Hello\n\nThis is a **note** with _content_.")).toBe(8);
  });
});
