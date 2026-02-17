import type { LoadingState } from "../lib/app-state.ts";
import styles from "./loading-screen.module.css";

interface LoadingScreenProps {
  state: LoadingState;
  onRetry: () => void;
  onChangeStorage: () => void;
}

export function LoadingScreen({ state, onRetry, onChangeStorage }: LoadingScreenProps) {
  return (
    <div class={styles.container}>
      <div class={styles.card}>
        <h1 class={styles.title}>Thought.Haus</h1>

        {state.phase === "scanning" && (
          <>
            <p class={styles.message}>Loading notes…</p>
            <p class={styles.count}>
              {state.loaded > 0 ? `${state.loaded} found` : "\u00A0"}
            </p>
            <div class={styles.progressTrack}>
              <div class={styles.progressIndeterminate} />
            </div>
          </>
        )}

        {state.phase === "indexing" && (
          <>
            <p class={styles.message}>Building search index…</p>
            <p class={styles.count}>
              {state.loaded} / {state.total}
            </p>
            <div class={styles.progressTrack}>
              <div
                class={styles.progressBar}
                style={{ width: state.total > 0 ? `${(state.loaded / state.total) * 100}%` : "0%" }}
              />
            </div>
          </>
        )}

        {state.phase === "error" && (
          <>
            <div class={styles.errorMessage}>{state.message}</div>
            <div class={styles.actions}>
              <button class={styles.cta} onClick={onRetry}>
                Retry
              </button>
              <button class={styles.changeLink} onClick={onChangeStorage}>
                Change Storage
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
