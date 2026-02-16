import { Readability } from "@mozilla/readability";
import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

export interface ExtractedContent {
  title: string;
  content: string;
  textContent: string;
  author: string | null;
  siteName: string | null;
  excerpt: string | null;
  length: number;
}

export interface PageMetadata {
  title: string;
  url: string;
  domain: string;
  author: string | null;
  description: string | null;
  published: string | null;
  image: string | null;
  siteName: string | null;
  keywords: string[];
}

export type ClipMode = "article" | "selection" | "full-page" | "bookmark";

/** Extract article content using Readability. */
export function extractArticle(doc: Document): ExtractedContent | null {
  const clone = doc.cloneNode(true) as Document;
  const reader = new Readability(clone);
  const article = reader.parse();

  if (!article) return null;

  return {
    title: article.title,
    content: article.content,
    textContent: article.textContent,
    author: article.byline ?? null,
    siteName: article.siteName ?? null,
    excerpt: article.excerpt ?? null,
    length: article.length,
  };
}

/** Extract metadata from the current page's meta tags, Open Graph, etc. */
export function extractMetadata(doc: Document): PageMetadata {
  const getMeta = (name: string): string | null => {
    const el =
      doc.querySelector(`meta[property="${name}"]`) ??
      doc.querySelector(`meta[name="${name}"]`);
    return el?.getAttribute("content") ?? null;
  };

  const url = doc.location?.href ?? "";
  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch { /* ignore */ }

  const keywords = getMeta("keywords")
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean) ?? [];

  return {
    title: getMeta("og:title") ?? doc.title ?? "",
    url,
    domain,
    author: getMeta("author") ?? getMeta("article:author") ?? null,
    description: getMeta("og:description") ?? getMeta("description") ?? null,
    published: getMeta("article:published_time") ?? getMeta("date") ?? null,
    image: getMeta("og:image") ?? null,
    siteName: getMeta("og:site_name") ?? null,
    keywords,
  };
}

/** Get the currently selected text as HTML. */
export function getSelectionHTML(): string | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

  const container = document.createElement("div");
  for (let i = 0; i < selection.rangeCount; i++) {
    container.appendChild(selection.getRangeAt(i).cloneContents());
  }
  return container.innerHTML;
}

/** Get the full page body HTML. */
export function getFullPageHTML(): string {
  return document.body.innerHTML;
}

/** Create a configured Turndown service for HTML-to-Markdown conversion. */
function createTurndownService(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  });

  td.use(gfm);

  // Preserve code block language hints
  td.addRule("fencedCodeBlock", {
    filter(node) {
      return (
        node.nodeName === "PRE" &&
        node.firstChild !== null &&
        node.firstChild.nodeName === "CODE"
      );
    },
    replacement(_content, node) {
      const code = (node as HTMLElement).querySelector("code");
      if (!code) return _content;

      const className = code.getAttribute("class") ?? "";
      const langMatch = className.match(/language-(\S+)/);
      const lang = langMatch?.[1] ?? "";
      const text = code.textContent ?? "";

      return `\n\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
    },
  });

  return td;
}

/** Sanitize HTML and convert to Markdown. */
export function htmlToMarkdown(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "strong", "b", "em", "i", "del", "s",
      "table", "thead", "tbody", "tr", "th", "td",
      "input", // for task lists
      "div", "span",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "type", "checked"],
  });

  const td = createTurndownService();
  return td.turndown(clean).trim();
}

/** Run the full extraction pipeline for a given clip mode. */
export function extract(mode: ClipMode, doc: Document): { markdown: string; metadata: PageMetadata } {
  const metadata = extractMetadata(doc);

  let markdown: string;

  switch (mode) {
    case "article": {
      const article = extractArticle(doc);
      if (article) {
        metadata.title = article.title || metadata.title;
        metadata.author = article.author || metadata.author;
        markdown = htmlToMarkdown(article.content);
      } else {
        // Fallback to full page
        markdown = htmlToMarkdown(getFullPageHTML());
      }
      break;
    }
    case "selection": {
      const selHtml = getSelectionHTML();
      markdown = selHtml ? htmlToMarkdown(selHtml) : "";
      break;
    }
    case "full-page": {
      markdown = htmlToMarkdown(getFullPageHTML());
      break;
    }
    case "bookmark": {
      // Bookmark mode: no content extraction, just metadata
      markdown = "";
      break;
    }
  }

  return { markdown, metadata };
}

// Listen for messages from the popup/background
import { browser } from "../lib/browser-compat.ts";

try {
  browser.runtime.onMessage.addListener(
    (message: unknown, _sender: unknown, sendResponse: (response: unknown) => void) => {
      const msg = message as Record<string, unknown>;
      if (msg.type === "extract") {
        const result = extract(msg.mode as ClipMode, document);
        sendResponse(result);
      }
      if (msg.type === "get-selection") {
        sendResponse({ html: getSelectionHTML() });
      }
      if (msg.type === "get-metadata") {
        sendResponse(extractMetadata(document));
      }
      return true; // Keep message channel open for async response
    },
  );
} catch {
  // Content script not in extension context (e.g., during tests)
}
