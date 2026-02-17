import { getModel, getProviders, getModels } from "@mariozechner/pi-ai";
import type { Model, Api, KnownProvider } from "@mariozechner/pi-ai";

/** Providers that require server-side IAM/OAuth and won't work with a simple API key. */
const EXCLUDED_PROVIDERS = new Set<string>([
  "amazon-bedrock",
  "google-vertex",
  "google-gemini-cli",
  "google-antigravity",
  "openai-codex",
  "github-copilot",
  "azure-openai-responses",
  "opencode",
  "kimi-coding",
]);

const DISPLAY_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  xai: "xAI",
  groq: "Groq",
  cerebras: "Cerebras",
  openrouter: "OpenRouter",
  mistral: "Mistral",
  minimax: "MiniMax",
  "minimax-cn": "MiniMax CN",
  huggingface: "Hugging Face",
  "vercel-ai-gateway": "Vercel AI Gateway",
  zai: "zAI",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface ProviderInfo {
  id: string;
  name: string;
}

export function getAvailableProviders(): ProviderInfo[] {
  return getProviders()
    .filter((p) => !EXCLUDED_PROVIDERS.has(p))
    .map((p) => ({ id: p, name: DISPLAY_NAMES[p] ?? capitalize(p) }));
}

export function getModelsForProvider(provider: string): Model<Api>[] {
  try {
    return getModels(provider as KnownProvider);
  } catch {
    return [];
  }
}

export function resolveModel(provider: string, modelId: string): Model<Api> {
  return getModel(provider as "anthropic" | "openai", modelId as never);
}
