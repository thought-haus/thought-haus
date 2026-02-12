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
import { getCommandNotes } from "../agent/command-loader.ts";
import { notesMap } from "../notes/note-store.ts";
import { slugify } from "../lib/slug.ts";
import type { Note } from "../notes/note.ts";
import styles from "./agent-panel.module.css";
import "../agent/slash-command-suggest.css";
import "../agent/note-mention-suggest.css";
import { getAtMentionQuery, getNonConversationNotes } from "../agent/note-mention.ts";

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

  // Slash command autocomplete state
  const [commandNotes, setCommandNotes] = useState<Note[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Note[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  // @-mention autocomplete state
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<Note[]>([]);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const mentionPopupRef = useRef<HTMLDivElement>(null);

  // Load command notes and all notes on mount and when notesMap changes
  useEffect(() => {
    setCommandNotes(getCommandNotes());
    setAllNotes(getNonConversationNotes());
  }, [notesMap.value]);

  // Close popup on outside click
  useEffect(() => {
    if (!showSuggestions && !showMentionPopup) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (target === textareaRef.current) return;
      if (showSuggestions && popupRef.current && !popupRef.current.contains(target)) {
        setShowSuggestions(false);
      }
      if (showMentionPopup && mentionPopupRef.current && !mentionPopupRef.current.contains(target)) {
        setShowMentionPopup(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showSuggestions, showMentionPopup]);

  const updateSlashSuggestions = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.startsWith("/") && !trimmed.includes(" ")) {
      const query = trimmed.slice(1).toLowerCase();
      const filtered = query
        ? commandNotes.filter((n) =>
            slugify(n.title).includes(query),
          )
        : commandNotes;
      setSuggestions(filtered);
      setSelectedIndex(0);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const updateMentionSuggestions = (value: string, cursorPos: number) => {
    const result = getAtMentionQuery(value, cursorPos);
    if (result) {
      const { query, start } = result;
      setMentionStart(start);
      const filtered = query
        ? allNotes.filter((n) =>
            n.title.toLowerCase().includes(query.toLowerCase()),
          )
        : allNotes;
      setMentionSuggestions(filtered);
      setMentionSelectedIndex(0);
      setShowMentionPopup(true);
      // Slash and mention popups are mutually exclusive
      setShowSuggestions(false);
    } else {
      setShowMentionPopup(false);
    }
  };

  const selectCommand = (note: Note) => {
    const slug = slugify(note.title);
    setText(`/${slug} `);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const selectMention = (note: Note) => {
    const before = text.slice(0, mentionStart);
    const after = text.slice(textareaRef.current?.selectionStart ?? text.length);
    const inserted = `@"${note.title}" `;
    setText(before + inserted + after);
    setShowMentionPopup(false);
    textareaRef.current?.focus();
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    setText("");
    setError(null);
    setShowSuggestions(false);
    setShowMentionPopup(false);

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
    // Slash command popup keyboard handling
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) =>
          i < suggestions.length - 1 ? i + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) =>
          i > 0 ? i - 1 : suggestions.length - 1,
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        selectCommand(suggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // @-mention popup keyboard handling
    if (showMentionPopup && mentionSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionSelectedIndex((i) =>
          i < mentionSuggestions.length - 1 ? i + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionSelectedIndex((i) =>
          i > 0 ? i - 1 : mentionSuggestions.length - 1,
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        selectMention(mentionSuggestions[mentionSelectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionPopup(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    setText(target.value);

    // Check for @-mention first (can appear anywhere), then slash commands (start only)
    const cursorPos = target.selectionStart ?? target.value.length;
    const mentionResult = getAtMentionQuery(target.value, cursorPos);
    if (mentionResult) {
      updateMentionSuggestions(target.value, cursorPos);
    } else {
      setShowMentionPopup(false);
      updateSlashSuggestions(target.value);
    }

    // Auto-resize
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 128) + "px";
  };

  return (
    <div class={styles.inputArea}>
      {error && <div class={styles.errorMessage}>{error}</div>}
      {showSuggestions && (
        <div ref={popupRef} class="slash-command-suggest">
          {suggestions.length === 0 ? (
            <div class="slash-command-suggest-empty">
              No matching commands
            </div>
          ) : (
            suggestions.map((note, i) => (
              <button
                key={note.id}
                class={`slash-command-suggest-item${i === selectedIndex ? " is-selected" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectCommand(note);
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <span class="slash-command-slug">
                  /{slugify(note.title)}
                </span>
                <span class="slash-command-title">{note.title}</span>
              </button>
            ))
          )}
        </div>
      )}
      {showMentionPopup && (
        <div ref={mentionPopupRef} class="note-mention-suggest">
          {mentionSuggestions.length === 0 ? (
            <div class="note-mention-suggest-empty">
              No matching notes
            </div>
          ) : (
            mentionSuggestions.map((note, i) => (
              <button
                key={note.id}
                class={`note-mention-suggest-item${i === mentionSelectedIndex ? " is-selected" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectMention(note);
                }}
                onMouseEnter={() => setMentionSelectedIndex(i)}
              >
                <span class="note-mention-title">{note.title}</span>
                {note.tags.length > 0 && (
                  <span class="note-mention-tags">
                    {note.tags.join(", ")}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
      <div class={styles.inputRow}>
        <textarea
          ref={textareaRef}
          class={styles.inputField}
          placeholder="Ask about your notes... (/ for commands, @ for notes)"
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
