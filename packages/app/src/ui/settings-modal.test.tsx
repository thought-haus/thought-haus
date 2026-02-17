import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { settingsOpen, settingsSection, closeSettings } from "../lib/settings-state.ts";
import { themeMode, folderName, storageBackend } from "../lib/app-state.ts";
import { agentSettings } from "../agent/agent-state.ts";
import { SettingsModal } from "./settings-modal.tsx";

describe("SettingsModal", () => {
  beforeEach(() => {
    settingsOpen.value = false;
    settingsSection.value = "appearance";
    themeMode.value = "system";
    folderName.value = null;
    storageBackend.value = null;
  });

  it("does not render when closed", () => {
    render(<SettingsModal onChangeStorage={() => {}} />);
    expect(screen.queryByText("Appearance")).not.toBeInTheDocument();
  });

  it("renders when open", () => {
    settingsOpen.value = true;
    render(<SettingsModal onChangeStorage={() => {}} />);
    expect(screen.getAllByText("Appearance").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText("Close settings")).toBeInTheDocument();
  });

  it("shows all three section nav buttons", () => {
    settingsOpen.value = true;
    render(<SettingsModal onChangeStorage={() => {}} />);
    // Section nav buttons in sidebar (there are two "Appearance" — one in nav, one as title)
    expect(screen.getAllByText("Appearance").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Storage")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("shows section tabs in order: Appearance, Storage, AI", () => {
    settingsOpen.value = true;
    render(<SettingsModal onChangeStorage={() => {}} />);
    const buttons = screen.getAllByRole("button").filter(
      (btn) => ["Appearance", "Storage", "AI"].includes(btn.textContent?.trim() ?? ""),
    );
    expect(buttons[0].textContent?.trim()).toBe("Appearance");
    expect(buttons[1].textContent?.trim()).toBe("Storage");
    expect(buttons[2].textContent?.trim()).toBe("AI");
  });

  it("opens to Appearance section by default", () => {
    settingsOpen.value = true;
    render(<SettingsModal onChangeStorage={() => {}} />);
    expect(screen.getByText("Theme")).toBeInTheDocument();
  });

  it("switches to Storage section when clicked", () => {
    settingsOpen.value = true;
    render(<SettingsModal onChangeStorage={() => {}} />);
    fireEvent.click(screen.getByText("Storage"));
    expect(screen.getByText("Current Storage")).toBeInTheDocument();
    expect(screen.getByText("Change Storage")).toBeInTheDocument();
  });

  it("switches to AI section when clicked", () => {
    settingsOpen.value = true;
    render(<SettingsModal onChangeStorage={() => {}} />);
    fireEvent.click(screen.getByText("AI"));
    expect(screen.getByText("Provider")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
  });

  it("opens directly to a specific section", () => {
    settingsOpen.value = true;
    settingsSection.value = "ai";
    render(<SettingsModal onChangeStorage={() => {}} />);
    expect(screen.getByText("Provider")).toBeInTheDocument();
  });

  it("closes on Escape key", async () => {
    settingsOpen.value = true;
    render(<SettingsModal onChangeStorage={() => {}} />);
    expect(screen.getByText("Theme")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    await waitFor(() => {
      expect(settingsOpen.value).toBe(false);
    });
  });

  it("closes when X button is clicked", async () => {
    settingsOpen.value = true;
    render(<SettingsModal onChangeStorage={() => {}} />);

    fireEvent.click(screen.getByLabelText("Close settings"));

    await waitFor(() => {
      expect(settingsOpen.value).toBe(false);
    });
  });

  describe("Appearance section", () => {
    beforeEach(() => {
      settingsOpen.value = true;
      settingsSection.value = "appearance";
    });

    it("renders theme segmented control with all options", () => {
      render(<SettingsModal onChangeStorage={() => {}} />);
      expect(screen.getByText("Light")).toBeInTheDocument();
      expect(screen.getByText("Dark")).toBeInTheDocument();
      expect(screen.getByText("System")).toBeInTheDocument();
    });

    it("marks current theme as pressed", () => {
      themeMode.value = "dark";
      render(<SettingsModal onChangeStorage={() => {}} />);
      expect(screen.getByText("Dark").closest("button")?.getAttribute("aria-pressed")).toBe("true");
      expect(screen.getByText("Light").closest("button")?.getAttribute("aria-pressed")).toBe("false");
    });

    it("changes theme when option is clicked", () => {
      render(<SettingsModal onChangeStorage={() => {}} />);
      fireEvent.click(screen.getByText("Dark"));
      expect(themeMode.value).toBe("dark");
    });
  });

  describe("Storage section", () => {
    beforeEach(() => {
      settingsOpen.value = true;
      settingsSection.value = "storage";
    });

    it("shows Local Folder when backend is local", () => {
      storageBackend.value = { type: "local", name: "my-notes" } as any;
      folderName.value = "my-notes";
      render(<SettingsModal onChangeStorage={() => {}} />);
      expect(screen.getByText(/Local Folder/)).toBeInTheDocument();
      expect(screen.getByText(/my-notes/)).toBeInTheDocument();
    });

    it("shows WebDAV when backend is webdav", () => {
      storageBackend.value = { type: "webdav", name: "myserver.com" } as any;
      folderName.value = "myserver.com";
      render(<SettingsModal onChangeStorage={() => {}} />);
      expect(screen.getByText(/WebDAV/)).toBeInTheDocument();
    });

    it("calls onChangeStorage when Change button is clicked", () => {
      const onChangeStorage = vi.fn();
      render(<SettingsModal onChangeStorage={onChangeStorage} />);
      fireEvent.click(screen.getByText("Change"));
      expect(onChangeStorage).toHaveBeenCalledOnce();
    });
  });

  describe("AI section", () => {
    beforeEach(() => {
      settingsOpen.value = true;
      settingsSection.value = "ai";
    });

    it("renders provider and model dropdowns", () => {
      render(<SettingsModal onChangeStorage={() => {}} />);
      expect(screen.getByText("Provider")).toBeInTheDocument();
      expect(screen.getByText("Model")).toBeInTheDocument();
    });

    it("renders API key input", () => {
      render(<SettingsModal onChangeStorage={() => {}} />);
      expect(screen.getByPlaceholderText("Enter API key...")).toBeInTheDocument();
    });

    it("shows active provider name in API key label", () => {
      render(<SettingsModal onChangeStorage={() => {}} />);
      expect(screen.getByText(/API Key \(Anthropic\)/)).toBeInTheDocument();
    });

    it("updates API key when typed", () => {
      render(<SettingsModal onChangeStorage={() => {}} />);
      const input = screen.getByPlaceholderText("Enter API key...");
      fireEvent.input(input, { target: { value: "sk-test-123" } });
      expect(agentSettings.value.providers.anthropic.apiKey).toBe("sk-test-123");
    });
  });
});
