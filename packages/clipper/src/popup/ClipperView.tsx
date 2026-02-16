import { useState, useEffect } from "preact/hooks";
import { browser } from "../lib/browser-compat.ts";
import { createBackendFromConfig, clearClipperConfig } from "../lib/storage-setup.ts";
import type { ClipperStorageConfig } from "../lib/storage-setup.ts";
import { renderClip, matchTemplate } from "../templates/engine.ts";
import type { ClipTemplate } from "../templates/engine.ts";
import { DEFAULT_TEMPLATES, getDefaultTemplate } from "../templates/defaults.ts";
import type { PageMetadata } from "../content/extractor.ts";
import type { ClipMode } from "../content/extractor.ts";
import type { TemplateContext } from "../templates/variables.ts";

interface Props {
  config: ClipperStorageConfig;
  onReset: () => void;
}

/** Inject the content script if not already present. */
async function ensureContentScript(tabId: number): Promise<void> {
  try {
    await browser.tabs.sendMessage(tabId, { type: "ping" });
  } catch {
    await browser.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
    // Wait briefly for script to initialize
    await new Promise((r) => setTimeout(r, 100));
  }
}

type ClipStatus = "idle" | "clipping" | "success" | "error";

export function ClipperView({ config, onReset }: Props) {
  const [mode, setMode] = useState<ClipMode>("article");
  const [metadata, setMetadata] = useState<PageMetadata | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [template, setTemplate] = useState<ClipTemplate>(getDefaultTemplate("article"));
  const [status, setStatus] = useState<ClipStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Check for intent from context menu / keyboard shortcut, then fetch metadata
  useEffect(() => {
    (async () => {
      try {
        // Read intent set by background script (context menu or quick-clip)
        const data = await browser.storage.local.get("clipperIntent");
        const intent = data.clipperIntent as
          | { mode: string; linkUrl?: string; timestamp: number }
          | undefined;
        if (intent && Date.now() - intent.timestamp < 5000) {
          // Intent is fresh — apply it
          const validModes: ClipMode[] = ["article", "selection", "full-page", "bookmark"];
          if (validModes.includes(intent.mode as ClipMode)) {
            handleModeChange(intent.mode as ClipMode);
          }
          // Clear the intent so it doesn't persist
          await browser.storage.local.remove("clipperIntent");
        }

        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return;

        // Inject content script on demand (not pre-injected via manifest)
        await ensureContentScript(tab.id);

        const response = await browser.tabs.sendMessage(tab.id, { type: "get-metadata" });
        if (!response || typeof response !== "object" || !("title" in response)) return;
        const meta = response as PageMetadata;
        setMetadata(meta);
        setTitle(meta.title);

        // Auto-select template based on URL
        const matched = matchTemplate(meta.url, DEFAULT_TEMPLATES);
        if (matched) {
          setTemplate(matched);
        }
      } catch {
        // Content script may not be available
      }
    })();
  }, []);

  function handleModeChange(newMode: ClipMode) {
    setMode(newMode);
    setTemplate(getDefaultTemplate(newMode));
  }

  async function handleClip() {
    setStatus("clipping");
    setErrorMsg("");

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab");

      await ensureContentScript(tab.id);

      // Extract content from page
      const raw = await browser.tabs.sendMessage(tab.id, {
        type: "extract",
        mode,
      });
      if (!raw || typeof raw !== "object" || "error" in raw) {
        throw new Error((raw as { error?: string })?.error ?? "Extraction failed");
      }
      const extraction = raw as { markdown: string; metadata: PageMetadata };

      // Build template context
      const now = new Date();
      const ctx: TemplateContext = {
        metadata: { ...extraction.metadata, title: title || extraction.metadata.title },
        content: extraction.markdown,
        selection: mode === "selection" ? extraction.markdown : "",
        highlights: "",
        now,
      };

      // Render the note
      const extraTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const { filename, content } = renderClip(template, ctx, extraTags);

      // Write to storage backend
      const backend = await createBackendFromConfig(config);
      if (!backend) {
        throw new Error("Storage not available. Please reconfigure.");
      }

      try {
        const path = template.folder ? `${template.folder}/${filename}` : filename;
        await backend.write(path, content);
      } finally {
        backend.disconnect();
      }

      setStatus("success");

      // Auto-close after success
      setTimeout(() => window.close(), 1500);
    } catch (e) {
      setStatus("error");
      setErrorMsg((e as Error).message);
    }
  }

  async function handleReset() {
    await clearClipperConfig();
    onReset();
  }

  const modes: Array<{ value: ClipMode; label: string }> = [
    { value: "article", label: "Article" },
    { value: "selection", label: "Selection" },
    { value: "full-page", label: "Full Page" },
    { value: "bookmark", label: "Bookmark" },
  ];

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "14px", color: "#2c2420", margin: 0 }}>Clip to Thought.Haus</h2>
        <button
          onClick={handleReset}
          style={{
            fontSize: "11px",
            color: "#8a7e76",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Settings
        </button>
      </div>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: "4px" }}>
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => handleModeChange(m.value)}
            style={{
              flex: 1,
              padding: "5px 2px",
              fontSize: "11px",
              border: "1px solid",
              borderColor: mode === m.value ? "#b8621b" : "#d5cec7",
              background: mode === m.value ? "#b8621b" : "transparent",
              color: mode === m.value ? "#fff" : "#2c2420",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
        placeholder="Title"
        style={{
          padding: "8px",
          border: "1px solid #d5cec7",
          borderRadius: "6px",
          fontSize: "13px",
          outline: "none",
        }}
      />

      {/* Tags */}
      <input
        type="text"
        value={tags}
        onInput={(e) => setTags((e.target as HTMLInputElement).value)}
        placeholder="Tags (comma-separated)"
        style={{
          padding: "8px",
          border: "1px solid #d5cec7",
          borderRadius: "6px",
          fontSize: "13px",
          outline: "none",
        }}
      />

      {/* Page info */}
      {metadata && (
        <div style={{ fontSize: "11px", color: "#8a7e76", lineHeight: "1.4" }}>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {metadata.domain}
          </div>
          {metadata.author && <div>By {metadata.author}</div>}
        </div>
      )}

      {/* Clip button */}
      <button
        onClick={handleClip}
        disabled={status === "clipping"}
        style={{
          padding: "10px",
          background: status === "success" ? "#38a169" : status === "clipping" ? "#d5cec7" : "#b8621b",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: status === "clipping" ? "default" : "pointer",
          fontSize: "13px",
          fontWeight: "bold",
        }}
      >
        {status === "idle" && "Clip"}
        {status === "clipping" && "Clipping..."}
        {status === "success" && "Clipped!"}
        {status === "error" && "Retry"}
      </button>

      {/* Error message */}
      {status === "error" && errorMsg && (
        <p style={{ color: "#c53030", fontSize: "11px" }}>{errorMsg}</p>
      )}

      {/* Storage indicator */}
      <div style={{ fontSize: "10px", color: "#a89e96", textAlign: "center" }}>
        Saving to {config.type === "local" ? "local folder" : config.webdav?.url ?? "WebDAV"}
      </div>
    </div>
  );
}
