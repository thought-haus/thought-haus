import { useEffect, useState } from "preact/hooks";
import { SetupView } from "./SetupView.tsx";
import { ClipperView } from "./ClipperView.tsx";
import { loadClipperConfig } from "../lib/storage-setup.ts";
import type { ClipperStorageConfig } from "../lib/storage-setup.ts";

export function App() {
  const [config, setConfig] = useState<ClipperStorageConfig | null | undefined>(undefined);

  useEffect(() => {
    loadClipperConfig().then(setConfig).catch(() => setConfig(null));
  }, []);

  // Loading
  if (config === undefined) {
    return <div style={{ padding: "24px", textAlign: "center", color: "#8a7e76" }}>Loading...</div>;
  }

  // Not configured — show setup
  if (config === null) {
    return <SetupView onConfigured={setConfig} />;
  }

  // Configured — show clipper
  return <ClipperView config={config} onReset={() => setConfig(null)} />;
}
