import { describe, it, expect, beforeEach } from "vitest";
import {
  settingsOpen,
  settingsSection,
  openSettings,
  closeSettings,
} from "./settings-state.ts";

describe("settings-state", () => {
  beforeEach(() => {
    settingsOpen.value = false;
    settingsSection.value = "appearance";
  });

  describe("openSettings", () => {
    it("opens settings modal", () => {
      openSettings();
      expect(settingsOpen.value).toBe(true);
    });

    it("defaults to current section when no section given", () => {
      settingsSection.value = "storage";
      openSettings();
      expect(settingsSection.value).toBe("storage");
      expect(settingsOpen.value).toBe(true);
    });

    it("sets section when provided", () => {
      openSettings("ai");
      expect(settingsSection.value).toBe("ai");
      expect(settingsOpen.value).toBe(true);
    });

    it("changes section to storage", () => {
      openSettings("storage");
      expect(settingsSection.value).toBe("storage");
    });
  });

  describe("closeSettings", () => {
    it("closes settings modal", () => {
      settingsOpen.value = true;
      closeSettings();
      expect(settingsOpen.value).toBe(false);
    });

    it("preserves the active section after closing", () => {
      openSettings("ai");
      closeSettings();
      expect(settingsSection.value).toBe("ai");
    });
  });
});
