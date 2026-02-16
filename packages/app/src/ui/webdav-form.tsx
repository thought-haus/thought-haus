import { useState } from "preact/hooks";
import type { ConnectionResult } from "@thought-haus/core";
import { testWebDavConnection } from "@thought-haus/core";
import styles from "./onboarding.module.css";

interface WebDavFormProps {
  onConnect: (config: { url: string; username: string; password: string }) => void;
  initialUrl?: string;
}

export function WebDavForm({ onConnect, initialUrl }: WebDavFormProps) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionResult | null>(null);

  const canTest = url.trim().length > 0 && username.trim().length > 0 && password.length > 0;
  const testPassed = testResult?.ok === true;

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const result = await testWebDavConnection(url.trim(), username.trim(), password);
    setTestResult(result);
    setTesting(false);
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (testPassed) {
      onConnect({ url: url.trim(), username: username.trim(), password });
    }
  }

  function errorMessage(): string | null {
    if (!testResult || testResult.ok) return null;
    switch (testResult.error) {
      case "cors":
        return "CORS error: The server is blocking browser requests. The WebDAV server must include Access-Control-Allow-Origin headers.";
      case "auth":
        return "Authentication failed. Check your username and password.";
      case "not_found":
        return "Server URL not found. Check the URL and ensure the WebDAV endpoint exists.";
      default:
        return testResult.error;
    }
  }

  return (
    <form class={styles.webdavForm} onSubmit={handleSubmit}>
      <label class={styles.formLabel}>
        Server URL
        <input
          class={styles.formInput}
          type="url"
          placeholder="https://example.com/webdav/"
          value={url}
          onInput={(e) => {
            setUrl((e.target as HTMLInputElement).value);
            setTestResult(null);
          }}
          required
        />
      </label>
      <label class={styles.formLabel}>
        Username
        <input
          class={styles.formInput}
          type="text"
          placeholder="username"
          value={username}
          autoComplete="username"
          onInput={(e) => {
            setUsername((e.target as HTMLInputElement).value);
            setTestResult(null);
          }}
          required
        />
      </label>
      <label class={styles.formLabel}>
        Password
        <div class={styles.passwordRow}>
          <input
            class={styles.formInput}
            type={showPassword ? "text" : "password"}
            placeholder="password"
            value={password}
            autoComplete="current-password"
            onInput={(e) => {
              setPassword((e.target as HTMLInputElement).value);
              setTestResult(null);
            }}
            required
          />
          <button
            type="button"
            class={styles.togglePassword}
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>

      {testResult && !testResult.ok && (
        <p class={styles.formError}>{errorMessage()}</p>
      )}
      {testPassed && (
        <p class={styles.formSuccess}>Connection successful</p>
      )}

      <div class={styles.formActions}>
        <button
          type="button"
          class={styles.testBtn}
          onClick={handleTest}
          disabled={!canTest || testing}
        >
          {testing ? "Testing..." : "Test Connection"}
        </button>
        <button
          type="submit"
          class={styles.cta}
          disabled={!testPassed}
        >
          Connect
        </button>
      </div>
    </form>
  );
}
