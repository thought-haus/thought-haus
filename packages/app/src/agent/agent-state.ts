import { signal, computed } from "@preact/signals";
import type { Message } from "@mariozechner/pi-ai";

export interface ProviderConfig {
  apiKey: string;
}

export interface AgentSettings {
  providers: Record<string, ProviderConfig>;
  activeProvider: string;
  activeModel: string;
}

const SETTINGS_KEY = "th-agent-settings";

const DEFAULT_SETTINGS: AgentSettings = {
  providers: {
    anthropic: { apiKey: "" },
  },
  activeProvider: "anthropic",
  activeModel: "claude-sonnet-4-5-20250929",
};

/** Whether the agent panel is open. */
export const agentPanelOpen = signal(false);

/** Current sub-view inside the agent panel. */
export const agentPanelView = signal<"chat" | "settings">("chat");

/** Note ID of the active conversation. */
export const activeConversationId = signal<string | null>(null);

/** Whether the agent is currently streaming a response. */
export const isAgentStreaming = signal(false);

/** Partial assistant text during streaming. */
export const streamingText = signal("");

/** In-memory messages for the active conversation (Pi Message format). */
export const conversationMessages = signal<Message[]>([]);

/** Agent settings (API keys, provider, model). */
export const agentSettings = signal<AgentSettings>(loadSettings());

/** Whether the active provider has an API key configured. */
export const hasApiKey = computed(() => {
  const s = agentSettings.value;
  const provider = s.providers[s.activeProvider];
  return Boolean(provider?.apiKey);
});

function loadSettings(): AgentSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AgentSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        providers: {
          ...DEFAULT_SETTINGS.providers,
          ...parsed.providers,
        },
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AgentSettings): void {
  agentSettings.value = settings;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable
  }
}
