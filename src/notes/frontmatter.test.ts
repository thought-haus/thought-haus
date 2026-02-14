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

  it("captures unknown fields as properties", () => {
    const content = `---
title: Note
custom_field: value
tags:
  - test
---
Body`;

    const { frontMatter, body } = parseFrontMatter(content);
    expect(frontMatter.title).toBe("Note");
    expect(frontMatter.tags).toEqual(["test"]);
    expect(frontMatter.properties).toEqual({ custom_field: "value" });
    expect(body).toBe("Body");
  });

  it("parses description property for skill notes", () => {
    const content = `---
title: My Skill
description: Helps format code blocks
tags:
  - noti-skill
---
Skill body`;

    const { frontMatter } = parseFrontMatter(content);
    expect(frontMatter.title).toBe("My Skill");
    expect(frontMatter.properties.description).toBe("Helps format code blocks");
    expect(frontMatter.tags).toEqual(["noti-skill"]);
  });

  it("returns empty properties when no unknown fields", () => {
    const content = `---
title: Simple
tags:
---
Body`;

    const { frontMatter } = parseFrontMatter(content);
    expect(frontMatter.properties).toEqual({});
  });

  it("returns empty properties for content without front matter", () => {
    const { frontMatter } = parseFrontMatter("Just text");
    expect(frontMatter.properties).toEqual({});
  });

  it("handles Windows-style line endings", () => {
    const content = "---\r\ntitle: Note\r\ntags:\r\n  - work\r\n---\r\nBody";
    const { frontMatter, body } = parseFrontMatter(content);
    expect(frontMatter.title).toBe("Note");
    expect(frontMatter.tags).toEqual(["work"]);
    expect(body).toBe("Body");
  });

  it("treats minimal front matter delimiters as no front matter", () => {
    // ---\n---\n has no content between delimiters — treated as regular content
    const content = "---\n---\nBody";
    const { frontMatter, body } = parseFrontMatter(content);
    expect(frontMatter.tags).toEqual([]);
    expect(body).toBe(content);
  });

  it("parses front matter with single empty line between delimiters", () => {
    const content = "---\n\n---\nBody";
    const { frontMatter, body } = parseFrontMatter(content);
    expect(frontMatter.tags).toEqual([]);
    expect(body).toBe("Body");
  });

  it("preserves multiple tags in order", () => {
    const content = `---
title: Tagged
tags:
  - alpha
  - beta
  - gamma
---
Content`;

    const { frontMatter } = parseFrontMatter(content);
    expect(frontMatter.tags).toEqual(["alpha", "beta", "gamma"]);
  });
});

describe("serializeFrontMatter", () => {
  it("serializes front matter and body", () => {
    const result = serializeFrontMatter(
      { title: "My Note", date: "2024-03-22T13:18:56", tags: ["work"], properties: {} },
      "Hello",
    );
    expect(result).toBe(
      `---\ntitle: My Note\ndate: 2024-03-22T13:18:56\ntags:\n  - work\n---\nHello`,
    );
  });

  it("serializes with empty tags", () => {
    const result = serializeFrontMatter(
      { title: "Note", date: "2024-01-01", tags: [], properties: {} },
      "Body",
    );
    expect(result).toContain("tags:\n---");
  });

  it("serializes properties between date and tags", () => {
    const result = serializeFrontMatter(
      { title: "Skill", date: "2024-01-01", tags: ["noti-skill"], properties: { description: "My description" } },
      "Body",
    );
    expect(result).toBe(
      `---\ntitle: Skill\ndate: 2024-01-01\ndescription: My description\ntags:\n  - noti-skill\n---\nBody`,
    );
  });

  it("round-trips arbitrary properties through serialize/parse", () => {
    const original = {
      title: "Round Trip",
      date: "2024-06-15",
      tags: ["test"],
      properties: { description: "A skill", priority: "high" },
    };
    const serialized = serializeFrontMatter(original, "Content");
    const { frontMatter, body } = parseFrontMatter(serialized);
    expect(frontMatter.title).toBe("Round Trip");
    expect(frontMatter.date).toBe("2024-06-15");
    expect(frontMatter.tags).toEqual(["test"]);
    expect(frontMatter.properties).toEqual({ description: "A skill", priority: "high" });
    expect(body).toBe("Content");
  });
});
