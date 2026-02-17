import { signal, effect } from "@preact/signals";

export type ThemeMode = "light" | "dark" | "system";

const stored = localStorage.getItem("th-docs-theme") as ThemeMode | null;
export const themeMode = signal<ThemeMode>(stored || "system");

function applyTheme(mode: ThemeMode) {
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  if (isDark) {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
}

effect(() => {
  const mode = themeMode.value;
  applyTheme(mode);
  if (mode === "system") {
    localStorage.removeItem("th-docs-theme");
  } else {
    localStorage.setItem("th-docs-theme", mode);
  }
});

// React to system theme changes when in "system" mode
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    if (themeMode.value === "system") {
      applyTheme("system");
    }
  });

export function cycleTheme() {
  const order: ThemeMode[] = ["dark", "light", "system"];
  const idx = order.indexOf(themeMode.value);
  themeMode.value = order[(idx + 1) % order.length];
}
