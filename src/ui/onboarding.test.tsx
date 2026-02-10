import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { Onboarding } from "./onboarding.tsx";

describe("Onboarding", () => {
  it("renders the Noti title", () => {
    render(<Onboarding onOpenFolder={() => {}} />);
    expect(screen.getByText("Noti")).toBeInTheDocument();
  });

  it("renders the Open a Folder button", () => {
    render(<Onboarding onOpenFolder={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Open a Folder" }),
    ).toBeInTheDocument();
  });

  it("calls onOpenFolder when button is clicked", () => {
    const onOpenFolder = vi.fn();
    render(<Onboarding onOpenFolder={onOpenFolder} />);
    fireEvent.click(screen.getByRole("button", { name: "Open a Folder" }));
    expect(onOpenFolder).toHaveBeenCalledOnce();
  });
});
