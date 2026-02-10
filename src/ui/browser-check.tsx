import styles from "./browser-check.module.css";

export function BrowserCheck() {
  return (
    <div class={styles.container}>
      <div class={styles.card}>
        <h1 class={styles.title}>Browser Not Supported</h1>
        <p class={styles.message}>
          Noti requires a Chromium-based browser (Chrome, Edge, Brave, or Arc)
          to access local files on your device.
        </p>
        <p class={styles.hint}>
          Please open Noti in one of the supported browsers to get started.
        </p>
      </div>
    </div>
  );
}
