import { describe, it, expect } from "vitest";
import { render } from "@testing-library/preact";
import { MarkdownRenderer } from "./markdown-renderer.tsx";

function renderHtml(content: string): HTMLElement {
  const { container } = render(<MarkdownRenderer content={content} />);
  return container.querySelector(".tiptap")!;
}

describe("MarkdownRenderer", () => {
  it("wraps output in a .tiptap div", () => {
    const { container } = render(<MarkdownRenderer content="hello" />);
    const el = container.querySelector(".tiptap");
    expect(el).toBeInTheDocument();
    expect(el!.tagName).toBe("DIV");
  });

  it("renders plain text as a paragraph", () => {
    const el = renderHtml("hello world");
    expect(el.querySelector("p")!.textContent).toBe("hello world");
  });

  it("renders headings", () => {
    const el = renderHtml("# Title\n## Subtitle");
    expect(el.querySelector("h1")!.textContent).toBe("Title");
    expect(el.querySelector("h2")!.textContent).toBe("Subtitle");
  });

  it("renders bold and italic", () => {
    const el = renderHtml("**bold** and *italic*");
    expect(el.querySelector("strong")!.textContent).toBe("bold");
    expect(el.querySelector("em")!.textContent).toBe("italic");
  });

  it("renders inline code", () => {
    const el = renderHtml("use `console.log()`");
    expect(el.querySelector("code")!.textContent).toBe("console.log()");
  });

  it("renders fenced code blocks", () => {
    const el = renderHtml("```js\nconst x = 1;\n```");
    const pre = el.querySelector("pre");
    expect(pre).toBeInTheDocument();
    expect(pre!.querySelector("code")!.textContent).toBe("const x = 1;\n");
  });

  it("renders unordered lists", () => {
    const el = renderHtml("- one\n- two\n- three");
    const items = el.querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe("one");
  });

  it("renders ordered lists", () => {
    const el = renderHtml("1. first\n2. second");
    expect(el.querySelector("ol")).toBeInTheDocument();
    expect(el.querySelectorAll("li")).toHaveLength(2);
  });

  it("renders blockquotes", () => {
    const el = renderHtml("> a quote");
    expect(el.querySelector("blockquote")).toBeInTheDocument();
    expect(el.querySelector("blockquote")!.textContent!.trim()).toBe("a quote");
  });

  it("renders horizontal rules", () => {
    const el = renderHtml("above\n\n---\n\nbelow");
    expect(el.querySelector("hr")).toBeInTheDocument();
  });

  it("renders links with target=_blank", () => {
    const el = renderHtml("[example](https://example.com)");
    const link = el.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("renders single newlines as <br> (breaks mode)", () => {
    const el = renderHtml("line one\nline two");
    expect(el.querySelector("br")).toBeInTheDocument();
  });

  // GFM features
  it("renders strikethrough", () => {
    const el = renderHtml("~~deleted~~");
    expect(el.querySelector("del")!.textContent).toBe("deleted");
  });

  it("renders task lists", () => {
    const el = renderHtml("- [x] done\n- [ ] todo");
    const checkboxes = el.querySelectorAll("input[type='checkbox']");
    expect(checkboxes).toHaveLength(2);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
  });

  it("renders tables", () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const el = renderHtml(md);
    expect(el.querySelector("table")).toBeInTheDocument();
    expect(el.querySelectorAll("td")).toHaveLength(2);
  });

  // Sanitization
  it("strips script tags", () => {
    const el = renderHtml("hi <script>alert('xss')</script> bye");
    expect(el.innerHTML).not.toContain("<script>");
    expect(el.textContent).toContain("hi");
    expect(el.textContent).toContain("bye");
  });

  it("strips onerror attributes from images", () => {
    const el = renderHtml('<img src="x" onerror="alert(1)">');
    const img = el.querySelector("img");
    expect(img?.getAttribute("onerror")).toBeNull();
  });

  it("strips javascript: hrefs", () => {
    const el = renderHtml("[click](javascript:alert(1))");
    const link = el.querySelector("a");
    // DOMPurify either removes the link or strips the dangerous href
    if (link) {
      const href = link.getAttribute("href") ?? "";
      expect(href).not.toContain("javascript:");
    }
  });

  it("renders empty string without errors", () => {
    const el = renderHtml("");
    expect(el).toBeInTheDocument();
  });
});
