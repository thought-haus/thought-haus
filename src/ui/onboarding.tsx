import styles from "./onboarding.module.css";

interface OnboardingProps {
  onOpenFolder: () => void;
}

export function Onboarding({ onOpenFolder }: OnboardingProps) {
  return (
    <div class={styles.container}>
      <div class={styles.card}>
        <h1 class={styles.title}>Noti</h1>
        <p class={styles.subtitle}>
          A local-first note-taking app. Your notes never leave your device.
        </p>
        <button class={styles.cta} onClick={onOpenFolder}>
          Open a Folder
        </button>
        <p class={styles.hint}>
          Select a folder to store your notes as Markdown files.
        </p>
      </div>
    </div>
  );
}
