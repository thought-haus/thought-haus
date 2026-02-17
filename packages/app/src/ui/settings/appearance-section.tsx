import { themeMode, setTheme } from "../../lib/app-state.ts";
import type { ThemeMode } from "../../lib/app-state.ts";
import { Sun, Moon, Monitor } from "lucide-preact";
import styles from "../settings-modal.module.css";

const THEMES: { mode: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Light", Icon: Sun },
  { mode: "dark", label: "Dark", Icon: Moon },
  { mode: "system", label: "System", Icon: Monitor },
];

export function AppearanceSection() {
  const current = themeMode.value;

  return (
    <div>
      <div class={styles.settingRow}>
        <div>
          <div class={styles.settingLabel}>Theme</div>
          <div class={styles.settingHint}>Choose light, dark, or match your system preference.</div>
        </div>
        <div class={styles.segmentedControl}>
          {THEMES.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              class={`${styles.segmentedBtn} ${current === mode ? styles.segmentedBtnActive : ""}`}
              onClick={() => setTheme(mode)}
              aria-pressed={current === mode}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
