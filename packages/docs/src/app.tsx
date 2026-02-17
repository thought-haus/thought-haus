import { signal, effect } from "@preact/signals";
import type { DocPage } from "./types.ts";
import { currentPath } from "./router.ts";
import { loadPage } from "./lib/page-loader.ts";
import { Layout } from "./components/layout.tsx";

const page = signal<DocPage | null>(null);
const loading = signal(true);

effect(() => {
  const slug = currentPath.value;
  loading.value = true;

  loadPage(slug).then((result) => {
    page.value = result;
    loading.value = false;
    if (result) {
      document.title = `${result.frontmatter.title} — Thought.Haus Docs`;
    }
  });
});

export function App() {
  return <Layout page={page.value} loading={loading.value} />;
}
