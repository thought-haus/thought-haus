import styles from "./callout.module.css";

interface CalloutProps {
  type: "info" | "warning" | "tip";
  title?: string;
  children: preact.ComponentChildren;
}

const typeStyles: Record<string, string> = {
  info: styles.calloutInfo,
  warning: styles.calloutWarning,
  tip: styles.calloutTip,
};

export function Callout({ type, title, children }: CalloutProps) {
  return (
    <div class={`${styles.callout} ${typeStyles[type] || styles.calloutInfo}`}>
      {title && <div class={styles.calloutTitle}>{title}</div>}
      <div class={styles.calloutBody}>{children}</div>
    </div>
  );
}
