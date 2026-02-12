import { Agent } from "@mariozechner/pi-agent-core";
import type { AgentEvent } from "@mariozechner/pi-agent-core";
import type { AssistantMessage, TextContent } from "@mariozechner/pi-ai";
import {
  agentSettings,
  isAgentStreaming,
  streamingText,
  conversationMessages,
  activeConversationId,
} from "./agent-state.ts";
import { buildSystemPrompt } from "./system-prompt.ts";
import { createTools } from "./tools.ts";
import { resolveModel } from "./agent-settings.ts";
import {
  createConversationNote,
  saveConversation,
} from "./conversation-persistence.ts";
import {
  parseSlashCommand,
  getCommandNotes,
  loadCommandBody,
} from "./command-loader.ts";
import { slugify } from "../lib/slug.ts";

let agent: Agent | null = null;

function getOrCreateAgent(): Agent {
  if (!agent) {
    agent = new Agent();
  }
  return agent;
}

export async function sendMessage(userText: string): Promise<void> {
  const settings = agentSettings.value;
  const providerConfig = settings.providers[settings.activeProvider];
  if (!providerConfig?.apiKey) {
    throw new Error("No API key configured. Open settings to add one.");
  }

  // Create conversation if needed
  if (!activeConversationId.value) {
    const id = await createConversationNote();
    if (!id) throw new Error("Failed to create conversation note.");
    activeConversationId.value = id;
  }

  // Resolve slash command
  let commandBody: string | undefined;
  const parsed = parseSlashCommand(userText);
  if (parsed) {
    const commandNotes = getCommandNotes();
    const match = commandNotes.find(
      (n) => slugify(n.title) === parsed.commandSlug,
    );
    if (match) {
      commandBody = await loadCommandBody(match);
    }
  }

  const systemPrompt = await buildSystemPrompt(commandBody);
  const model = resolveModel(settings.activeProvider, settings.activeModel);
  const tools = createTools();

  const a = getOrCreateAgent();
  a.setSystemPrompt(systemPrompt);
  a.setModel(model);
  a.setTools(tools);
  a.getApiKey = () => providerConfig.apiKey;

  // Sync Pi agent state with our conversation messages
  a.replaceMessages(conversationMessages.value);

  // Subscribe to events for streaming UI
  const unsub = a.subscribe(handleAgentEvent);

  isAgentStreaming.value = true;
  streamingText.value = "";

  try {
    await a.prompt(userText);
  } finally {
    unsub();
    isAgentStreaming.value = false;
    streamingText.value = "";

    // Sync messages back from agent
    conversationMessages.value = [...a.state.messages];

    // Save conversation
    const convId = activeConversationId.value;
    if (convId) {
      await saveConversation(convId, conversationMessages.value);
    }
  }
}

function handleAgentEvent(event: AgentEvent): void {
  switch (event.type) {
    case "message_update": {
      // Extract partial text for streaming display
      const msg = event.message;
      if (msg.role === "assistant") {
        const assistantMsg = msg as AssistantMessage;
        const text = assistantMsg.content
          .filter((c): c is TextContent => c.type === "text")
          .map((c) => c.text)
          .join("");
        streamingText.value = text;
      }
      break;
    }
    case "message_end":
      streamingText.value = "";
      break;
    case "agent_end":
      streamingText.value = "";
      break;
  }
}

export function cancelStreaming(): void {
  agent?.abort();
}

export function newConversation(): void {
  activeConversationId.value = null;
  conversationMessages.value = [];
  // Reset agent state for new conversation
  agent?.clearMessages();
}
