import { useState } from "preact/hooks";
import styles from "./onboarding.module.css";

interface RePermissionProps {
  folderName: string;
  onReopen: () => Promise<void> | void;
  onPickNew: () => Promise<void> | void;
}

export function RePermission({
  folderName,
  onReopen,
  onPickNew,
}: RePermissionProps) {
  const [opening, setOpening] = useState(false);

  const handleReopen = async () => {
    if (opening) return;
    setOpening(true);
    try {
      await onReopen();
    } finally {
      setOpening(false);
    }
  };

  return (
    <div class={styles.container}>
      <div class={styles.card}>
        <h1 class={styles.title}>Welcome Back</h1>
        <p class={styles.subtitle}>
          Re-open <strong>{folderName}</strong> to access your notes.
        </p>
        <button class={styles.cta} onClick={handleReopen} disabled={opening}>
          {opening ? "Opening…" : `Re-open ${folderName}`}
        </button>
        <p class={styles.hint}>
          <button
            onClick={onPickNew}
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
            Or choose a different folder
          </button>
        </p>
      </div>
    </div>
  );
}
