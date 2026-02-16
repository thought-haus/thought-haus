import { defineConfig, build as viteBuild } from "vite";
import preact from "@preact/preset-vite";
import { resolve } from "node:path";
import { copyFileSync, cpSync, existsSync } from "node:fs";
import type { Plugin } from "vite";

const isFirefox = process.env.BROWSER === "firefox";
const manifestSrc = isFirefox ? "manifest.firefox.json" : "manifest.chrome.json";
const outDir = isFirefox ? "dist-firefox" : "dist-chrome";

/** Copy manifest.json and icons into the build output after bundling. */
function copyStaticAssets(): Plugin {
  return {
    name: "copy-static-assets",
    closeBundle() {
      // Copy manifest
      copyFileSync(
        resolve(__dirname, manifestSrc),
        resolve(__dirname, outDir, "manifest.json"),
      );
      // Copy icons
      const iconsDir = resolve(__dirname, "icons");
      if (existsSync(iconsDir)) {
        cpSync(iconsDir, resolve(__dirname, outDir, "icons"), { recursive: true });
      }
      // Copy background.html for Firefox (uses background page instead of service_worker)
      if (isFirefox) {
        copyFileSync(
          resolve(__dirname, "background.html"),
          resolve(__dirname, outDir, "background.html"),
        );
      }
    },
  };
}

/**
 * Build the content script as a separate IIFE bundle after the main build.
 * Chrome content scripts cannot use ES module imports — they must be
 * self-contained scripts with all dependencies inlined.
 */
function buildContentScript(): Plugin {
  return {
    name: "build-content-script",
    async closeBundle() {
      await viteBuild({
        configFile: false,
        build: {
          outDir: resolve(__dirname, outDir),
          emptyOutDir: false,
          lib: {
            entry: resolve(__dirname, "src/content/extractor.ts"),
            formats: ["iife"],
            name: "ThoughtHausClipper",
            fileName: () => "content.js",
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
          target: "es2022",
          minify: false,
          sourcemap: true,
        },
      });
    },
  };
}

export default defineConfig({
  plugins: [preact(), copyStaticAssets(), buildContentScript()],
  base: "./",
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        background: resolve(__dirname, "src/background/service-worker.ts"),
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
