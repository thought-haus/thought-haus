import { appView, isBrowserCompatible } from "../lib/app-state.ts";
import { isFileSystemAccessSupported } from "../lib/browser.ts";
import { BrowserCheck } from "./browser-check.tsx";
import { Onboarding } from "./onboarding.tsx";
import { Layout } from "./layout.tsx";

if (!isFileSystemAccessSupported()) {
  isBrowserCompatible.value = false;
}

export function App() {
  if (!isBrowserCompatible.value) {
    return <BrowserCheck />;
  }

  if (appView.value === "onboarding") {
    return <Onboarding onOpenFolder={() => (appView.value = "main")} />;
  }

  return <Layout />;
}
