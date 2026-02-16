import { describe, it, expect } from "vitest";
import { applyFilter, parseFilterChain } from "./filters.ts";

describe("applyFilter", () => {
  it("applies slug filter", () => {
    expect(applyFilter("slug", "Hello World")).toBe("hello-world");
  });

  it("applies blockquote filter", () => {
    expect(applyFilter("blockquote", "line 1\nline 2")).toBe("> line 1\n> line 2");
  });

  it("applies trim filter", () => {
    expect(applyFilter("trim", "  hello  ")).toBe("hello");
  });

  it("applies uppercase filter", () => {
    expect(applyFilter("uppercase", "hello")).toBe("HELLO");
  });

  it("applies lowercase filter", () => {
    expect(applyFilter("lowercase", "HELLO")).toBe("hello");
  });

  it("applies truncate filter with argument", () => {
    expect(applyFilter("truncate", "hello world this is long", "10")).toBe("hello worl...");
  });

  it("applies truncate filter - short string unchanged", () => {
    expect(applyFilter("truncate", "hi", "10")).toBe("hi");
  });

  it("applies default filter", () => {
    expect(applyFilter("default", "", "fallback")).toBe("fallback");
    expect(applyFilter("default", "value", "fallback")).toBe("value");
  });

  it("returns value unchanged for unknown filter", () => {
    expect(applyFilter("nonexistent", "hello")).toBe("hello");
  });
});

describe("parseFilterChain", () => {
  it("parses single filter", () => {
    expect(parseFilterChain("slug")).toEqual([{ name: "slug" }]);
  });

  it("parses filter with argument", () => {
    expect(parseFilterChain("truncate:50")).toEqual([{ name: "truncate", arg: "50" }]);
  });

  it("parses chained filters", () => {
    expect(parseFilterChain("trim|slug")).toEqual([
      { name: "trim" },
      { name: "slug" },
    ]);
  });

  it("parses chain with arguments", () => {
    expect(parseFilterChain("default:\"untitled\"|slug")).toEqual([
      { name: "default", arg: "untitled" },
      { name: "slug" },
    ]);
  });
});
