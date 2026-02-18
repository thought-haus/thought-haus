import { useMemo } from "preact/hooks";
import { Marked } from "marked";
import DOMPurify from "dompurify";

const marked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    link({ href, text }) {
      return `<a href="${href ?? ""}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function MarkdownRenderer({ content }: { content: string }) {
  const html = useMemo(() => {
    const raw = marked.parse(content) as string;
    return DOMPurify.sanitize(raw, { ADD_ATTR: ["target"] });
  }, [content]);

  return (
    <div
      class="tiptap"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
