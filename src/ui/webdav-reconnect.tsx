import { useState } from "preact/hooks";
import styles from "./onboarding.module.css";

interface WebDavReconnectProps {
  serverUrl: string;
  onReconnect: () => void | Promise<void>;
  onChangeServer: () => void;
}

export function WebDavReconnect({ serverUrl, onReconnect, onChangeServer }: WebDavReconnectProps) {
  const [reconnecting, setReconnecting] = useState(false);

  async function handleReconnect() {
    setReconnecting(true);
    await onReconnect();
    setReconnecting(false);
  }

  return (
    <div class={styles.container}>
      <div class={styles.card}>
        <h1 class={styles.title}>Reconnect</h1>
        <p class={styles.subtitle}>
          Could not reach <strong>{serverUrl}</strong>. Check that the server is running.
        </p>
        <button class={styles.cta} onClick={handleReconnect} disabled={reconnecting}>
          {reconnecting ? "Reconnecting..." : "Reconnect"}
        </button>
        <p class={styles.hint}>
          <button
            onClick={onChangeServer}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-accent)",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "inherit",
              padding: 0,
              textDecoration: "none",
              borderBottom: "1px solid var(--color-border)",
              transition: "border-color 0.15s ease",
            }}
          >
            Change server
          </button>
        </p>
      </div>
    </div>
  );
}
