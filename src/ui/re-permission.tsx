import styles from "./onboarding.module.css";

interface RePermissionProps {
  folderName: string;
  onReopen: () => void;
  onPickNew: () => void;
}

export function RePermission({
  folderName,
  onReopen,
  onPickNew,
}: RePermissionProps) {
  return (
    <div class={styles.container}>
      <div class={styles.card}>
        <h1 class={styles.title}>Welcome Back</h1>
        <p class={styles.subtitle}>
          Re-open <strong>{folderName}</strong> to access your notes.
        </p>
        <button class={styles.cta} onClick={onReopen}>
          Re-open {folderName}
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
              textDecoration: "underline",
            }}
          >
            Or choose a different folder
          </button>
        </p>
      </div>
    </div>
  );
}
