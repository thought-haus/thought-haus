import { defineConfig, type Plugin } from "vite";
import preact from "@preact/preset-vite";
import { readFileSync } from "node:fs";
import { resolve, relative } from "node:path";

const contentDir = resolve(import.meta.dirname, "content");

/**
 * Vite plugin that transforms .md files in content/ into importable modules.
 *
 * Each module exports:
 *   html       — rendered HTML string
 *   frontmatter — { title, description }
 *   headings   — [{ depth, text, id }] for TOC
 */
function markdownPlugin(): Plugin {
  // Lazily initialized unified pipeline + shiki highlighter (singleton)
  let processor: Awaited<ReturnType<typeof createProcessor>> | null = null;
  let processorPromise: Promise<Awaited<ReturnType<typeof createProcessor>>> | null = null;

  async function createProcessor() {
    const { unified } = await import("unified");
    const remarkParse = (await import("remark-parse")).default;
    const remarkGfm = (await import("remark-gfm")).default;
    const remarkRehype = (await import("remark-rehype")).default;
    const rehypeSlug = (await import("rehype-slug")).default;
    const rehypeAutolinkHeadings = (await import("rehype-autolink-headings"))
      .default;
    const rehypeStringify = (await import("rehype-stringify")).default;
    const { createHighlighter } = await import("shiki");

    const highlighter = await createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [
        "typescript",
        "javascript",
        "html",
        "css",
        "json",
        "yaml",
        "markdown",
        "bash",
        "shell",
      ],
    });

    const pipe = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSlug)
      .use(rehypeAutolinkHeadings, {
        behavior: "wrap",
        properties: { className: ["heading-anchor"] },
      })
      .use(rehypeStringify, { allowDangerousHtml: true });

    return { pipe, highlighter };
  }

  return {
    name: "markdown-content",
    enforce: "pre",

    resolveId(source) {
      if (source.startsWith("virtual:content/")) {
        return "\0" + source;
      }
      return null;
    },

    async load(id) {
      if (!id.startsWith("\0virtual:content/")) return null;

      // e.g. "\0virtual:content/getting-started/what-is-thought-haus"
      const slug = id.replace("\0virtual:content/", "");
      const filePath = resolve(contentDir, slug + ".md");

      let raw: string;
      try {
        raw = readFileSync(filePath, "utf-8");
      } catch {
        throw new Error(`Markdown file not found: ${filePath}`);
      }

      // Parse frontmatter
      const matter = (await import("gray-matter")).default;
      const { data: frontmatter, content } = matter(raw);

      // Extract headings (h2, h3) for TOC
      const headings: { depth: number; text: string; id: string }[] = [];
      const headingRegex = /^(#{2,3})\s+(.+)$/gm;
      let match;
      while ((match = headingRegex.exec(content)) !== null) {
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        headings.push({ depth: match[1].length, text, id });
      }

      // Initialize processor lazily (singleton guard for parallel loads)
      if (!processor) {
        if (!processorPromise) {
          processorPromise = createProcessor();
        }
        processor = await processorPromise;
      }

      // Highlight code blocks with shiki before remark processing
      let processed = content;
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const replacements: { from: string; to: string }[] = [];

      let codeMatch;
      while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
        const lang = codeMatch[1] || "text";
        const code = codeMatch[2].trimEnd();
        try {
          const highlighted = processor.highlighter.codeToHtml(code, {
            lang,
            themes: { dark: "github-dark", light: "github-light" },
          });
          replacements.push({ from: codeMatch[0], to: highlighted });
        } catch {
          // If language not supported, fall back to plain code block
          replacements.push({
            from: codeMatch[0],
            to: `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`,
          });
        }
      }

      for (const r of replacements) {
        processed = processed.replace(r.from, r.to);
      }

      // Transform callout syntax: > [!type] title\n> content
      processed = processed.replace(
        /^> \[!(info|warning|tip)\]\s*(.*)\n((?:>.*\n?)*)/gm,
        (_match: string, type: string, title: string, body: string) => {
          const bodyText = body
            .replace(/^> ?/gm, "")
            .trim();
          return `<div class="callout callout-${type}"><div class="callout-title">${title || type}</div><div class="callout-body">${bodyText}</div></div>\n`;
        }
      );

      // Run unified pipeline
      const result = await processor.pipe.process(processed);
      const html = String(result);

      const code = [
        `export const html = ${JSON.stringify(html)};`,
        `export const frontmatter = ${JSON.stringify(frontmatter)};`,
        `export const headings = ${JSON.stringify(headings)};`,
      ].join("\n");

      return code;
    },

    configureServer(server) {
      // Watch content files for HMR
      server.watcher.add(contentDir);
      server.watcher.on("change", (file) => {
        if (file.startsWith(contentDir) && file.endsWith(".md")) {
          const rel = relative(contentDir, file).replace(/\.md$/, "");
          const moduleId = "\0virtual:content/" + rel;
          const mod = server.moduleGraph.getModuleById(moduleId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.hot.send({ type: "full-reload" });
          }
        }
      });
    },
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default defineConfig({
  base: "/docs/",
  plugins: [markdownPlugin(), preact()],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  build: {
    outDir: "../../dist-docs",
    emptyOutDir: true,
  },
});
