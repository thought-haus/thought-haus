const FRONT_MATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export interface FrontMatter {
  title?: string;
  date?: string;
  tags: string[];
  properties: Record<string, string>;
}

/** Parse YAML front matter from markdown content. Simple parser, no library needed. */
export function parseFrontMatter(content: string): {
  frontMatter: FrontMatter;
  body: string;
} {
  const match = content.match(FRONT_MATTER_RE);
  if (!match) {
    return { frontMatter: { tags: [], properties: {} }, body: content };
  }

  const yaml = match[1];
  const body = content.slice(match[0].length);
  const frontMatter: FrontMatter = { tags: [], properties: {} };

  let inTags = false;
  for (const line of yaml.split("\n")) {
    const trimmed = line.trim();

    if (inTags) {
      if (trimmed.startsWith("- ")) {
        frontMatter.tags.push(trimmed.slice(2).trim());
        continue;
      }
      inTags = false;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();

    if (key === "title") {
      frontMatter.title = value;
    } else if (key === "date") {
      frontMatter.date = value;
    } else if (key === "tags") {
      if (value.startsWith("[")) {
        // Inline array: tags: [work, personal]
        frontMatter.tags = value
          .slice(1, -1)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
      } else if (!value) {
        inTags = true;
      }
    } else if (key && value) {
      frontMatter.properties[key] = value;
    }
  }

  return { frontMatter, body };
}

/** Serialize front matter and body back to markdown content. */
export function serializeFrontMatter(
  frontMatter: FrontMatter,
  body: string,
): string {
  let yaml = "---\n";
  if (frontMatter.title !== undefined) {
    yaml += `title: ${frontMatter.title}\n`;
  }
  if (frontMatter.date !== undefined) {
    yaml += `date: ${frontMatter.date}\n`;
  }
  for (const [key, value] of Object.entries(frontMatter.properties)) {
    yaml += `${key}: ${value}\n`;
  }
  yaml += "tags:\n";
  for (const tag of frontMatter.tags) {
    yaml += `  - ${tag}\n`;
  }
  yaml += "---\n";
  return yaml + body;
}
