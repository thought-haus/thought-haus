import { useEffect, useState } from "preact/hooks";
import type { ComponentType } from "preact";
import { settingsOpen, settingsSection, closeSettings } from "../lib/settings-state.ts";
import type { SettingsSection } from "../lib/settings-state.ts";
import { AppearanceSection } from "./settings/appearance-section.tsx";
import { AiSection } from "./settings/ai-section.tsx";
import { StorageSection } from "./settings/storage-section.tsx";
import { AboutSection } from "./settings/about-section.tsx";
import { Paintbrush, Bot, HardDrive, Info, X } from "lucide-preact";
import styles from "./settings-modal.module.css";

interface SectionDef {
  id: SettingsSection;
  label: string;
  Icon: typeof Paintbrush;
  component: ComponentType<{ onChangeStorage: () => void }>;
}

const SECTIONS: SectionDef[] = [
  { id: "appearance", label: "Appearance", Icon: Paintbrush, component: AppearanceSection },
  { id: "storage", label: "Storage", Icon: HardDrive, component: StorageSection },
  { id: "ai", label: "AI", Icon: Bot, component: AiSection },
  { id: "about", label: "About", Icon: Info, component: AboutSection },
];

const CLOSE_ANIMATION_MS = 100;

interface SettingsModalProps {
  onChangeStorage: () => void;
}

export function SettingsModal({ onChangeStorage }: SettingsModalProps) {
  const isOpen = settingsOpen.value;
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      closeSettings();
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

  if (!isOpen && !closing) return null;

  const active = settingsSection.value;
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
  const ActiveComponent = section.component;

  return (
    <div
      class={`${styles.backdrop} ${closing ? styles.backdropClosing : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div class={`${styles.modal} ${closing ? styles.modalClosing : ""}`}>
        <div class={styles.sidebar}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              class={`${styles.sidebarItem} ${active === s.id ? styles.sidebarItemActive : ""}`}
              onClick={() => (settingsSection.value = s.id)}
            >
              <s.Icon size={16} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <div class={styles.content}>
          <div class={styles.contentHeader}>
            <div class={styles.contentTitle}>{section.label}</div>
            <button class={styles.closeBtn} onClick={handleClose} title="Close (Esc)" aria-label="Close settings">
              <X size={16} />
            </button>
          </div>
          <ActiveComponent onChangeStorage={onChangeStorage} />
        </div>
      </div>
    </div>
  );
}
