import { Menu, Moon, Sun, Monitor, ExternalLink } from "lucide-preact";
import { themeMode, cycleTheme } from "../lib/theme.ts";
import { mobileSidebarOpen } from "./layout.tsx";
import styles from "./header.module.css";

export function Header() {
  const themeIcon =
    themeMode.value === "dark" ? (
      <Moon size={16} />
    ) : themeMode.value === "light" ? (
      <Sun size={16} />
    ) : (
      <Monitor size={16} />
    );

  return (
    <header class={styles.header}>
      <button
        class={styles.menuBtn}
        onClick={() => {
          mobileSidebarOpen.value = !mobileSidebarOpen.value;
        }}
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>
      <a href="/docs/" class={styles.logo}>
        <span class={styles.logoMark}>th</span>
        Thought.Haus
        <span class={styles.docsBadge}>Docs</span>
      </a>
      <div class={styles.spacer} />
      <button
        class={styles.themeBtn}
        onClick={cycleTheme}
        aria-label="Toggle theme"
        title={`Theme: ${themeMode.value}`}
      >
        {themeIcon}
      </button>
      <a href="/" class={styles.appLink}>
        Open App
        <ExternalLink size={14} />
      </a>
    </header>
  );
}
