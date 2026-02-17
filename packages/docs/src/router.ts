import { signal, effect } from "@preact/signals";

export const currentPath = signal(getPathFromUrl());

function getPathFromUrl(): string {
  const base = import.meta.env.BASE_URL;
  let path = window.location.pathname;
  if (path.startsWith(base)) {
    path = path.slice(base.length);
  }
  // Remove leading/trailing slashes
  path = path.replace(/^\/|\/$/g, "");
  return path || "getting-started/what-is-thought-haus";
}

export function navigate(slug: string) {
  const base = import.meta.env.BASE_URL;
  const url = base + slug;
  window.history.pushState(null, "", url);
  currentPath.value = slug;
  window.scrollTo(0, 0);
}

// Handle back/forward navigation
window.addEventListener("popstate", () => {
  currentPath.value = getPathFromUrl();
});

// Sync document title with current page
effect(() => {
  // Title is updated by the App component after page loads
  void currentPath.value;
});
