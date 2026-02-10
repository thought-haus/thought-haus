import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/preact";
import { Layout } from "./layout.tsx";

describe("Layout", () => {
  it("renders the sidebar", () => {
    render(<Layout />);
    expect(screen.getByPlaceholderText("Search notes...")).toBeInTheDocument();
  });

  it("renders the editor placeholder", () => {
    render(<Layout />);
    expect(
      screen.getByText("Select a note or create a new one"),
    ).toBeInTheDocument();
  });

  it("renders the note list area", () => {
    render(<Layout />);
    expect(screen.getByLabelText("Note list")).toBeInTheDocument();
  });
});
