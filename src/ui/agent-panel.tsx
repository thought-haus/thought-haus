import { useEffect, useRef, useState } from "preact/hooks";
import type { Message, AssistantMessage, ToolResultMessage, TextContent, ToolCall } from "@mariozechner/pi-ai";
import {
  agentPanelOpen,
  agentPanelView,
  isAgentStreaming,
  streamingText,
  conversationMessages,
  activeConversationId,
  hasApiKey,
} from "../agent/agent-state.ts";
import { sendMessage, cancelStreaming, newConversation } from "../agent/agent-runner.ts";
import { listConversations, switchConversation } from "../agent/conversation-persistence.ts";
import { AgentSettingsPanel } from "./agent-settings-panel.tsx";
import styles from "./agent-panel.module.css";

export function AgentPanel() {
  if (agentPanelView.value === "settings") {
    return (
      <div class={styles.agentPanel}>
        <Header />
        <AgentSettingsPanel />
      </div>
    );
  }

  return (
    <div class={styles.agentPanel}>
      <Header />
      <ConversationSwitcher />
      {!hasApiKey.value ? (
        <SetupPrompt />
      ) : conversationMessages.value.length === 0 && !isAgentStreaming.value ? (
        <EmptyState />
      ) : (
        <MessageList />
      )}
      {hasApiKey.value && <AgentInput />}
    </div>
  );
}

function Header() {
  return (
    <div class={styles.header}>
      <span class={styles.headerTitle}>AI Assistant</span>
      <div class={styles.headerActions}>
        <button
          class={styles.iconBtn}
          title="Settings"
          onClick={() =>
            (agentPanelView.value =
              agentPanelView.value === "settings" ? "chat" : "settings")
          }
        >
          {"\u2699"}
        </button>
        <button
          class={styles.iconBtn}
          title="Close (Cmd+Shift+A)"
          onClick={() => (agentPanelOpen.value = false)}
        >
          {"\u2715"}
        </button>
      </div>
    </div>
  );
}

function ConversationSwitcher() {
  const conversations = listConversations();
  const currentId = activeConversationId.value;

  const handleSwitch = async (id: string) => {
    if (id === "new") {
      newConversation();
    } else {
      await switchConversation(id);
    }
  };

  return (
    <div class={styles.conversationBar}>
      <select
        class={styles.conversationSelect}
        value={currentId || ""}
        onChange={(e) => handleSwitch((e.target as HTMLSelectElement).value)}
      >
        {!currentId && <option value="">New conversation</option>}
        {conversations.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <button
        class={styles.iconBtn}
        title="New conversation"
        onClick={() => newConversation()}
      >
        +
      </button>
    </div>
  );
}

function SetupPrompt() {
  return (
    <div class={styles.emptyState}>
      <p>Configure an API key to start chatting.</p>
      <button
        class={styles.setupBtn}
        onClick={() => (agentPanelView.value = "settings")}
      >
        Open Settings
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div class={styles.emptyState}>
      <p>Start a conversation with the AI assistant.</p>
      <p style={{ fontSize: "0.75rem" }}>
        It can read, create, edit, and search your notes.
      </p>
    </div>
  );
}

function MessageList() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messages = conversationMessages.value;
  const streaming = streamingText.value;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  return (
    <div class={styles.messages}>
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      {isAgentStreaming.value && streaming && (
        <div class={styles.streamingMessage}>
          {streaming}
          <span class={styles.cursor} />
        </div>
      )}
      {isAgentStreaming.value && !streaming && (
        <div class={styles.streamingMessage}>
          <span class={styles.cursor} />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    const content = typeof message.content === "string"
      ? message.content
      : message.content
          .filter((c): c is TextContent => c.type === "text")
          .map((c) => c.text)
          .join("");
    return <div class={styles.userMessage}>{content}</div>;
  }

  if (message.role === "assistant") {
    const assistantMsg = message as AssistantMessage;
    const textParts: string[] = [];
    const toolCalls: ToolCall[] = [];

    for (const block of assistantMsg.content) {
      if (block.type === "text") textParts.push(block.text);
      else if (block.type === "toolCall") toolCalls.push(block);
    }

    // If there's an error message
    if (assistantMsg.errorMessage) {
      return <div class={styles.errorMessage}>{assistantMsg.errorMessage}</div>;
    }

    return (
      <>
        {textParts.length > 0 && (
          <div class={styles.assistantMessage}>{textParts.join("")}</div>
        )}
        {toolCalls.map((tc) => (
          <ToolCallBubble key={tc.id} toolCall={tc} />
        ))}
      </>
    );
  }

  if (message.role === "toolResult") {
    const toolResult = message as ToolResultMessage;
    return <ToolResultBubble result={toolResult} />;
  }

  return null;
}

function ToolCallBubble({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div class={styles.toolCallMessage}>
      <div class={styles.toolHeader} onClick={() => setExpanded(!expanded)}>
        <span
          class={`${styles.toolToggle} ${expanded ? styles.toolToggleOpen : ""}`}
        >
          {"\u25B6"}
        </span>
        <span class={styles.toolName}>{toolCall.name}</span>
      </div>
      {expanded && (
        <div class={styles.toolDetails}>
          {JSON.stringify(toolCall.arguments, null, 2)}
        </div>
      )}
    </div>
  );
}

function ToolResultBubble({ result }: { result: ToolResultMessage }) {
  const [expanded, setExpanded] = useState(false);
  const text = result.content
    .filter((c): c is TextContent => c.type === "text")
    .map((c) => c.text)
    .join("");

  return (
    <div class={styles.toolCallMessage}>
      <div class={styles.toolHeader} onClick={() => setExpanded(!expanded)}>
        <span
          class={`${styles.toolToggle} ${expanded ? styles.toolToggleOpen : ""}`}
        >
          {"\u25B6"}
        </span>
        <span class={styles.toolName}>{result.toolName} result</span>
        {result.isError && <span class={styles.toolError}>(error)</span>}
      </div>
      {expanded && (
        <div
          class={`${styles.toolDetails} ${result.isError ? styles.toolError : ""}`}
        >
          {text}
        </div>
      )}
    </div>
  );
}

function AgentInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streaming = isAgentStreaming.value;
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setText("");
    setError(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await sendMessage(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    setText(target.value);
    // Auto-resize
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 128) + "px";
  };

  return (
    <div class={styles.inputArea}>
      {error && <div class={styles.errorMessage}>{error}</div>}
      <div class={styles.inputRow}>
        <textarea
          ref={textareaRef}
          class={styles.inputField}
          placeholder="Ask about your notes..."
          value={text}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={streaming}
        />
        {streaming ? (
          <button class={styles.stopBtn} onClick={cancelStreaming}>
            Stop
          </button>
        ) : (
          <button
            class={styles.sendBtn}
            onClick={handleSend}
            disabled={!text.trim()}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
