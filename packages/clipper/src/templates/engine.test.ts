import { describe, it, expect } from "vitest";
import { expandTemplate, renderClip, matchTemplate } from "./engine.ts";
import type { ClipTemplate } from "./engine.ts";
import type { TemplateContext } from "./variables.ts";

function makeContext(overrides?: Partial<TemplateContext>): TemplateContext {
  return {
    metadata: {
      title: "Test Article",
      url: "https://example.com/article",
      domain: "example.com",
      author: "John Doe",
      description: "A test article",
      published: "2024-03-22",
      image: "https://example.com/image.jpg",
      siteName: "Example",
      keywords: ["test", "article"],
    },
    content: "This is the article content.",
    selection: "",
    highlights: "",
    now: new Date(2024, 2, 22, 13, 18, 56),
    ...overrides,
  };
}

describe("expandTemplate", () => {
  it("replaces simple variables", () => {
    const ctx = makeContext();
    expect(expandTemplate("Title: {{title}}", ctx)).toBe("Title: Test Article");
  });

  it("replaces variables with filters", () => {
    const ctx = makeContext();
    expect(expandTemplate("{{title|slug}}", ctx)).toBe("test-article");
  });

  it("handles unknown variables as empty string", () => {
    const ctx = makeContext();
    expect(expandTemplate("{{unknown}}", ctx)).toBe("");
  });

  it("handles multiple variables in one template", () => {
    const ctx = makeContext();
    const result = expandTemplate("{{title}} by {{author}}", ctx);
    expect(result).toBe("Test Article by John Doe");
  });

  it("handles chained filters", () => {
    const ctx = makeContext();
    expect(expandTemplate("{{title|lowercase|slug}}", ctx)).toBe("test-article");
  });
});

describe("renderClip", () => {
  it("generates a complete note with frontmatter", () => {
    const template: ClipTemplate = {
      name: "Test",
      filename: "{{date}}--{{title|slug}}.md",
      folder: "",
      tags: ["clipping"],
      properties: {},
      body: "{{content}}",
    };
    const ctx = makeContext();
    const { filename, content } = renderClip(template, ctx);

    expect(filename).toBe("20240322T131856--test-article.md");
    expect(content).toContain("---");
    expect(content).toContain("title: Test Article");
    expect(content).toContain("- clipping");
    expect(content).toContain("source: https://example.com/article");
    expect(content).toContain("This is the article content.");
  });

  it("merges extra tags", () => {
    const template: ClipTemplate = {
      name: "Test",
      filename: "test.md",
      folder: "",
      tags: ["clipping"],
      properties: {},
      body: "",
    };
    const { content } = renderClip(template, makeContext(), ["extra", "tags"]);
    expect(content).toContain("- clipping");
    expect(content).toContain("- extra");
    expect(content).toContain("- tags");
  });
});

describe("matchTemplate", () => {
  const templates: ClipTemplate[] = [
    {
      name: "YouTube",
      filename: "test.md",
      folder: "",
      tags: [],
      properties: {},
      body: "",
      triggers: ["https://www.youtube.com/watch"],
    },
    {
      name: "GitHub",
      filename: "test.md",
      folder: "",
      tags: [],
      properties: {},
      body: "",
      triggers: ["https://github.com/"],
    },
  ];

  it("matches by prefix", () => {
    const result = matchTemplate("https://www.youtube.com/watch?v=abc", templates);
    expect(result?.name).toBe("YouTube");
  });

  it("returns null when no match", () => {
    const result = matchTemplate("https://example.com/", templates);
    expect(result).toBeNull();
  });

  it("matches by regex trigger", () => {
    const regexTemplates: ClipTemplate[] = [
      {
        name: "Regex",
        filename: "test.md",
        folder: "",
        tags: [],
        properties: {},
        body: "",
        triggers: ["^https://.*\\.github\\.io/"],
      },
    ];
    const result = matchTemplate("https://docs.github.io/page", regexTemplates);
    expect(result?.name).toBe("Regex");
  });
});
