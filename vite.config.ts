/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from "vite";
import preact from "@preact/preset-vite";

/**
 * Vite plugin that stubs out Pi AI's Amazon Bedrock provider.
 *
 * Pi AI's register-builtins.js eagerly imports ALL providers including
 * amazon-bedrock.js, which top-level imports @aws-sdk/client-bedrock-runtime.
 * That SDK has Node.js-only transitive deps (@smithy/node-http-handler → stream.Readable)
 * that can't bundle for browsers.
 *
 * This plugin intercepts the import of amazon-bedrock.js and returns stub exports,
 * preventing the AWS SDK from ever entering the bundle.
 */
function stubBedrockProvider(): Plugin {
  return {
    name: "stub-bedrock-provider",
    enforce: "pre",
    resolveId(source, importer) {
      if (
        source.includes("amazon-bedrock") &&
        importer?.includes("@mariozechner/pi-ai")
      ) {
        return "\0virtual:amazon-bedrock-stub";
      }
      return null;
    },
    load(id) {
      if (id === "\0virtual:amazon-bedrock-stub") {
        return `
          export function streamBedrock() { throw new Error("Bedrock provider not available in browser"); }
          export function streamSimpleBedrock() { throw new Error("Bedrock provider not available in browser"); }
        `;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [stubBedrockProvider(), preact()],
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
