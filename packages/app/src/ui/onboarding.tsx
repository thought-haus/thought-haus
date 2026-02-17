import { useState } from "preact/hooks";
import { WebDavForm } from "./webdav-form.tsx";
import styles from "./onboarding.module.css";

interface OnboardingProps {
  onOpenFolder?: () => Promise<void> | void;
  onConnectWebDav: (config: { url: string; username: string; password: string }) => void;
  showLocalTab: boolean;
}

export function Onboarding({ onOpenFolder, onConnectWebDav, showLocalTab }: OnboardingProps) {
  const [tab, setTab] = useState<"local" | "webdav">(showLocalTab ? "local" : "webdav");
  const [opening, setOpening] = useState(false);

  const handleOpenFolder = async () => {
    if (!onOpenFolder || opening) return;
    setOpening(true);
    try {
      await onOpenFolder();
    } finally {
      setOpening(false);
    }
  };

  // If only WebDAV is available, skip tabs entirely
  if (!showLocalTab) {
    return (
      <div class={styles.container}>
        <div class={styles.card}>
          <h1 class={styles.title}>Thought.Haus</h1>
          <p class={styles.subtitle}>
            A local-first note-taking app. Connect to a WebDAV server to store your notes.
          </p>
          <WebDavForm onConnect={onConnectWebDav} />
        </div>
      </div>
    );
  }

  return (
    <div class={styles.container}>
      <div class={styles.card}>
        <h1 class={styles.title}>Thought.Haus</h1>
        <p class={styles.subtitle}>
          A local-first note-taking app. Your notes, your storage.
        </p>
        <div class={styles.tabs}>
          <button
            class={`${styles.tab} ${tab === "local" ? styles.tabActive : ""}`}
            onClick={() => setTab("local")}
          >
            Local Folder
          </button>
          <button
            class={`${styles.tab} ${tab === "webdav" ? styles.tabActive : ""}`}
            onClick={() => setTab("webdav")}
          >
            WebDAV Server
          </button>
        </div>
        {tab === "local" && (
          <>
            <button class={styles.cta} onClick={handleOpenFolder} disabled={opening}>
              {opening ? "Opening…" : "Open a Folder"}
            </button>
            <p class={styles.hint}>
              Select a folder to store your notes as Markdown files.
            </p>
          </>
        )}
        {tab === "webdav" && (
          <WebDavForm onConnect={onConnectWebDav} />
        )}
      </div>
    </div>
  );
}
