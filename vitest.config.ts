import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./packages/app/src/test-setup.ts"],
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
