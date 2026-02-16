import { useState } from "preact/hooks";
import { testWebDavConnection } from "@thought-haus/core";
import type { WebDavConfig } from "@thought-haus/core";
import {
  saveClipperConfig,
  hasFileSystemAccess,
  saveDirHandle,
} from "../lib/storage-setup.ts";
import type { ClipperStorageConfig } from "../lib/storage-setup.ts";

interface Props {
  onConfigured: (config: ClipperStorageConfig) => void;
}

export function SetupView({ onConfigured }: Props) {
  const [tab, setTab] = useState<"local" | "webdav">(hasFileSystemAccess() ? "local" : "webdav");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const canPickFolder = hasFileSystemAccess();

  async function handlePickFolder() {
    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      await saveDirHandle(handle);
      const config: ClipperStorageConfig = { type: "local", dirHandle: handle };
      await saveClipperConfig(config);
      onConfigured(config);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Failed to open folder.");
      }
    }
  }

  async function handleWebDavConnect() {
    setError(null);
    setTesting(true);
    try {
      const result = await testWebDavConnection(url, username, password);
      if (result.ok) {
        const webdav: WebDavConfig = { url, username, password };
        const config: ClipperStorageConfig = { type: "webdav", webdav };
        await saveClipperConfig(config);
        onConfigured(config);
      } else {
        const messages: Record<string, string> = {
          cors: "CORS error. Check your WebDAV server's CORS settings.",
          auth: "Authentication failed. Check username and password.",
          not_found: "Server not found at that URL.",
        };
        setError(messages[result.error] ?? `Connection failed: ${result.error}`);
      }
    } catch {
      setError("Connection failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div style={{ padding: "16px" }}>
      <h2 style={{ fontSize: "16px", marginBottom: "4px", color: "#2c2420" }}>
        Thought.Haus Clipper
      </h2>
      <p style={{ fontSize: "12px", color: "#8a7e76", marginBottom: "16px" }}>
        Choose where to save clips
      </p>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {canPickFolder && (
          <button
            onClick={() => { setTab("local"); setError(null); }}
            style={{
              flex: 1,
              padding: "6px",
              border: "1px solid",
              borderColor: tab === "local" ? "#b8621b" : "#d5cec7",
              background: tab === "local" ? "#b8621b" : "transparent",
              color: tab === "local" ? "#fff" : "#2c2420",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Local Folder
          </button>
        )}
        <button
          onClick={() => { setTab("webdav"); setError(null); }}
          style={{
            flex: 1,
            padding: "6px",
            border: "1px solid",
            borderColor: tab === "webdav" ? "#b8621b" : "#d5cec7",
            background: tab === "webdav" ? "#b8621b" : "transparent",
            color: tab === "webdav" ? "#fff" : "#2c2420",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          WebDAV Server
        </button>
      </div>

      {/* Local folder picker */}
      {tab === "local" && (
        <button
          onClick={handlePickFolder}
          style={{
            width: "100%",
            padding: "10px",
            background: "#b8621b",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Open a Folder
        </button>
      )}

      {/* WebDAV form */}
      {tab === "webdav" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            type="url"
            placeholder="https://your-server.com/webdav/"
            value={url}
            onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            style={inputStyle}
          />
          <button
            onClick={handleWebDavConnect}
            disabled={testing || !url || !username}
            style={{
              padding: "10px",
              background: testing || !url || !username ? "#d5cec7" : "#b8621b",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: testing || !url || !username ? "default" : "pointer",
              fontSize: "13px",
            }}
          >
            {testing ? "Connecting..." : "Connect"}
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <p style={{ color: "#c53030", fontSize: "12px", marginTop: "8px" }}>{error}</p>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "8px",
  border: "1px solid #d5cec7",
  borderRadius: "6px",
  fontSize: "13px",
  outline: "none",
  background: "#fff",
};
