import { describe, it, expect } from "vitest";
import { slugify } from "./slug.ts";

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("meeting notes")).toBe("meeting-notes");
  });

  it("strips special characters", () => {
    expect(slugify("what's up?")).toBe("whats-up");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("a - b -- c")).toBe("a-b-c");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify(" -hello- ")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("handles only special characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
