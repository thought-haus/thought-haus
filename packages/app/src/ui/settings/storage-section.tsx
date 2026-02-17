import { folderName, storageBackend } from "../../lib/app-state.ts";
import { HardDrive, Globe } from "lucide-preact";
import styles from "../settings-modal.module.css";

interface StorageSectionProps {
  onChangeStorage: () => void;
}

export function StorageSection({ onChangeStorage }: StorageSectionProps) {
  const name = folderName.value;
  const backend = storageBackend.value;
  const backendType = backend?.type ?? "local";
  const isLocal = backendType === "local";

  return (
    <div>
      <div class={styles.settingRow}>
        <div>
          <div class={styles.settingLabel}>Current Storage</div>
          <div class={styles.settingHint}>
            {isLocal ? <HardDrive size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} /> : <Globe size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: "4px" }} />}
            {isLocal ? "Local Folder" : "WebDAV"}{name ? `: ${name}` : ""}
          </div>
        </div>
      </div>

      <div class={styles.settingRow}>
        <div>
          <div class={styles.settingLabel}>Change Storage</div>
          <div class={styles.settingHint}>Disconnect and choose a different folder or server.</div>
        </div>
        <button class={styles.settingBtn} onClick={onChangeStorage}>
          Change
        </button>
      </div>
    </div>
  );
}
