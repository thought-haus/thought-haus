import { signal } from "@preact/signals";
import { ChevronRight } from "lucide-preact";
import { navigation } from "../lib/navigation.ts";
import { currentPath, navigate } from "../router.ts";
import { mobileSidebarOpen } from "./layout.tsx";
import styles from "./sidebar.module.css";

// All sections start expanded
const collapsedSections = signal<Set<string>>(new Set());

function toggleSection(title: string) {
  const next = new Set(collapsedSections.value);
  if (next.has(title)) {
    next.delete(title);
  } else {
    next.add(title);
  }
  collapsedSections.value = next;
}

export function Sidebar() {
  return (
    <nav class={styles.sidebar}>
      {navigation.map((section) => {
        const isCollapsed = collapsedSections.value.has(section.title);
        return (
          <div class={styles.section} key={section.title}>
            <button
              class={styles.sectionTitle}
              onClick={() => toggleSection(section.title)}
            >
              <ChevronRight
                size={12}
                class={`${styles.chevron} ${isCollapsed ? "" : styles.chevronOpen}`}
              />
              {section.title}
            </button>
            {!isCollapsed &&
              section.items.map((item) => {
                const isActive = currentPath.value === item.slug;
                return (
                  <a
                    key={item.slug}
                    class={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                    href={import.meta.env.BASE_URL + item.slug}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(item.slug);
                      mobileSidebarOpen.value = false;
                    }}
                  >
                    {item.title}
                  </a>
                );
              })}
          </div>
        );
      })}
    </nav>
  );
}
