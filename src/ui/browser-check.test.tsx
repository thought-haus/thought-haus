import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import { BrowserCheck } from "./browser-check.tsx";

describe("BrowserCheck", () => {
  it("renders the unsupported browser message", () => {
    render(<BrowserCheck />);
    expect(screen.getByText("Browser Not Supported")).toBeInTheDocument();
  });

  it("mentions Chromium-based browsers", () => {
    render(<BrowserCheck />);
    expect(screen.getByText(/Chrome, Edge, Brave, or Arc/)).toBeInTheDocument();
  });
});
