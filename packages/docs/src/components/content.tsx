import type { DocPage } from "../types.ts";
import styles from "./content.module.css";

interface ContentProps {
  page: DocPage | null;
  loading: boolean;
}

export function Content({ page, loading }: ContentProps) {
  if (loading) {
    return (
      <div class={styles.wrapper}>
        <div class={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!page) {
    return (
      <div class={styles.wrapper}>
        <div class={styles.notFound}>
          <div class={styles.notFoundTitle}>Page not found</div>
          <p class={styles.notFoundText}>
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class={styles.wrapper}>
      <h1 class={styles.pageTitle}>{page.frontmatter.title}</h1>
      {page.frontmatter.description && (
        <p class={styles.pageDescription}>{page.frontmatter.description}</p>
      )}
      <div class="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
    </div>
  );
}
