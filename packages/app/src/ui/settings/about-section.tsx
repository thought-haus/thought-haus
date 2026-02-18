import { Github, Bug, MessageSquare } from "lucide-preact";
import styles from "../settings-modal.module.css";
import aboutStyles from "./about-section.module.css";

export function AboutSection() {
  return (
    <div>
      <div class={aboutStyles.blurb}>
        <p>
          Thought.Haus is free, open-source software. Notes are stored as plain Markdown files
          on your device — no accounts, no cloud, no tracking.
        </p>
      </div>

      <div class={styles.settingRow}>
        <div>
          <div class={styles.settingLabel}>Source code</div>
          <div class={styles.settingHint}>MIT licensed. Contributions welcome.</div>
        </div>
        <a
          href="https://github.com/thought-haus/thought-haus"
          target="_blank"
          rel="noopener noreferrer"
          class={`${styles.settingBtn} ${aboutStyles.linkBtn}`}
        >
          <Github size={14} />
          <span>GitHub</span>
        </a>
      </div>

      <div class={styles.settingRow}>
        <div>
          <div class={styles.settingLabel}>Bug reports &amp; feature requests</div>
          <div class={styles.settingHint}>Found a bug or have an idea? Open an issue.</div>
        </div>
        <a
          href="https://github.com/thought-haus/thought-haus/issues"
          target="_blank"
          rel="noopener noreferrer"
          class={`${styles.settingBtn} ${aboutStyles.linkBtn}`}
        >
          <Bug size={14} />
          <span>Issues</span>
        </a>
      </div>

      <div class={styles.settingRow}>
        <div>
          <div class={styles.settingLabel}>Discussions</div>
          <div class={styles.settingHint}>Questions, ideas, or just say hi.</div>
        </div>
        <a
          href="https://github.com/thought-haus/thought-haus/discussions"
          target="_blank"
          rel="noopener noreferrer"
          class={`${styles.settingBtn} ${aboutStyles.linkBtn}`}
        >
          <MessageSquare size={14} />
          <span>Discussions</span>
        </a>
      </div>

    </div>
  );
}
