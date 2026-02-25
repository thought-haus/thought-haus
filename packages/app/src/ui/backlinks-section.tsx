import { useState } from "preact/hooks";
import { selectedNoteId } from "../lib/app-state.ts";
import { getBacklinks } from "../notes/backlink-index.ts";
import { ChevronDown, ChevronRight, ArrowUpRight } from "lucide-preact";
import styles from "./backlinks-section.module.css";

/** Collapsed state persisted per-session (not per-note). */
let sessionCollapsed = false;

export function BacklinksSection({ noteId }: { noteId: string }) {
  const backlinks = getBacklinks(noteId);

  const [collapsed, setCollapsed] = useState(sessionCollapsed);

  if (backlinks.length === 0) return null;

  const toggle = () => {
    const next = !collapsed;
    sessionCollapsed = next;
    setCollapsed(next);
  };

  return (
    <div class={styles.backlinks}>
      <button
        class={styles.header}
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={`${backlinks.length} backlinks, click to ${collapsed ? "expand" : "collapse"}`}
      >
        <span class={styles.headerLeft}>
          <ArrowUpRight size={14} class={styles.headerIcon} />
          <span>
            {backlinks.length} {backlinks.length === 1 ? "backlink" : "backlinks"}
          </span>
        </span>
        {collapsed ? (
          <ChevronRight size={14} class={styles.chevron} />
        ) : (
          <ChevronDown size={14} class={styles.chevron} />
        )}
      </button>
      {!collapsed && (
        <ul class={styles.list}>
          {backlinks.map((note) => (
            <li key={note.id}>
              <button
                class={styles.item}
                onClick={() => {
                  selectedNoteId.value = note.id;
                }}
                title={note.title}
              >
                {note.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
