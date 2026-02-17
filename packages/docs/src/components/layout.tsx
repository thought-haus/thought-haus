import { signal } from "@preact/signals";
import type { DocPage } from "../types.ts";
import { Header } from "./header.tsx";
import { Sidebar } from "./sidebar.tsx";
import { Content } from "./content.tsx";
import { TableOfContents } from "./toc.tsx";
import styles from "./layout.module.css";

export const mobileSidebarOpen = signal(false);

interface LayoutProps {
  page: DocPage | null;
  loading: boolean;
}

export function Layout({ page, loading }: LayoutProps) {
  return (
    <div class={styles.layout}>
      <div class={styles.headerArea}>
        <Header />
      </div>
      <div
        class={`${styles.sidebarOverlay} ${mobileSidebarOpen.value ? styles.open : ""}`}
        onClick={() => {
          mobileSidebarOpen.value = false;
        }}
      />
      <div
        class={`${styles.sidebarArea} ${mobileSidebarOpen.value ? styles.open : ""}`}
      >
        <Sidebar />
      </div>
      <div class={styles.contentArea}>
        <Content page={page} loading={loading} />
      </div>
      <div class={styles.tocArea}>
        {page && <TableOfContents headings={page.headings} />}
      </div>
    </div>
  );
}
