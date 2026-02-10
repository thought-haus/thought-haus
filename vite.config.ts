/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    css: { modules: { classNameStrategy: "non-scoped" } },
  },
});
