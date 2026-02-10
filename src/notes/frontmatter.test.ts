import { describe, it, expect } from "vitest";
import { parseFrontMatter, serializeFrontMatter } from "./frontmatter.ts";

describe("parseFrontMatter", () => {
  it("parses front matter with list-style tags", () => {
    const content = `---
title: Meeting Notes
date: 2024-03-22T13:18:56
tags:
  - project
  - work
---
Hello world`;

    const { frontMatter, body } = parseFrontMatter(content);
    expect(frontMatter.title).toBe("Meeting Notes");
    expect(frontMatter.date).toBe("2024-03-22T13:18:56");
    expect(frontMatter.tags).toEqual(["project", "work"]);
    expect(body).toBe("Hello world");
  });

  it("parses front matter with inline tags", () => {
    const content = `---
title: Quick Note
tags: [work, personal]
---
Body`;

    const { frontMatter, body } = parseFrontMatter(content);
    expect(frontMatter.title).toBe("Quick Note");
    expect(frontMatter.tags).toEqual(["work", "personal"]);
    expect(body).toBe("Body");
  });

  it("returns empty tags for content without front matter", () => {
    const content = "Just some markdown";
    const { frontMatter, body } = parseFrontMatter(content);
    expect(frontMatter.tags).toEqual([]);
    expect(body).toBe("Just some markdown");
  });

  it("handles front matter with no tags", () => {
    const content = `---
title: No Tags
date: 2024-01-01
tags:
---
Body`;

    const { frontMatter } = parseFrontMatter(content);
    expect(frontMatter.tags).toEqual([]);
  });

  it("handles empty body", () => {
    const content = `---
title: Empty
tags:
---
`;

    const { frontMatter, body } = parseFrontMatter(content);
    expect(frontMatter.title).toBe("Empty");
    expect(body).toBe("");
  });
});

describe("serializeFrontMatter", () => {
  it("serializes front matter and body", () => {
    const result = serializeFrontMatter(
      { title: "My Note", date: "2024-03-22T13:18:56", tags: ["work"] },
      "Hello",
    );
    expect(result).toBe(
      `---\ntitle: My Note\ndate: 2024-03-22T13:18:56\ntags:\n  - work\n---\nHello`,
    );
  });

  it("serializes with empty tags", () => {
    const result = serializeFrontMatter(
      { title: "Note", date: "2024-01-01", tags: [] },
      "Body",
    );
    expect(result).toContain("tags:\n---");
  });
});
