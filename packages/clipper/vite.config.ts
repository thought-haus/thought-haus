import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "node:path";

const isFirefox = process.env.BROWSER === "firefox";

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: isFirefox ? "dist-firefox" : "dist-chrome",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background/service-worker.ts"),
        content: resolve(__dirname, "src/content/extractor.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    target: "es2022",
    minify: false,
    sourcemap: true,
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
