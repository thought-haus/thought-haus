import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { appView, isBrowserCompatible } from "../lib/app-state.ts";
import { App } from "./app.tsx";

vi.mock("../lib/browser.ts", () => ({
  isFileSystemAccessSupported: () => true,
}));

describe("App", () => {
  beforeEach(() => {
    appView.value = "onboarding";
    isBrowserCompatible.value = true;
  });

  it("shows onboarding by default", () => {
    render(<App />);
    expect(screen.getByText("Noti")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open a Folder" }),
    ).toBeInTheDocument();
  });

  it("shows main layout when view is main", () => {
    appView.value = "main";
    render(<App />);
    expect(screen.getByPlaceholderText("Search notes...")).toBeInTheDocument();
    expect(
      screen.getByText("Select a note or create a new one"),
    ).toBeInTheDocument();
  });

  it("shows browser check when browser is incompatible", () => {
    isBrowserCompatible.value = false;
    render(<App />);
    expect(screen.getByText("Browser Not Supported")).toBeInTheDocument();
  });

  it("transitions from onboarding to main on Open a Folder click", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Open a Folder" }));
    expect(appView.value).toBe("main");
  });
});
