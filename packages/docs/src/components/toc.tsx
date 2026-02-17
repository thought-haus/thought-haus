import { signal, effect } from "@preact/signals";
import type { TOCItem } from "../types.ts";
import styles from "./toc.module.css";

const activeId = signal("");

interface TOCProps {
  headings: TOCItem[];
}

export function TableOfContents({ headings }: TOCProps) {
  if (headings.length === 0) return null;

  // Set up IntersectionObserver for scroll-spy
  effect(() => {
    const ids = headings.map((h) => h.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId.value = entry.target.id;
          }
        }
      },
      {
        rootMargin: "-80px 0px -70% 0px",
        threshold: 0,
      }
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  });

  return (
    <div class={styles.toc}>
      <div class={styles.title}>On this page</div>
      <ul class={styles.list}>
        {headings.map((heading) => (
          <li class={styles.item} key={heading.id}>
            <a
              href={`#${heading.id}`}
              class={`${styles.link} ${heading.depth === 3 ? styles.linkH3 : ""} ${activeId.value === heading.id ? styles.linkActive : ""}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(heading.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  history.replaceState(null, "", `#${heading.id}`);
                  activeId.value = heading.id;
                }
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
