import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { Onboarding } from "./onboarding.tsx";

describe("Onboarding", () => {
  it("renders the Thought.Haus title", () => {
    render(<Onboarding onOpenFolder={() => {}} onConnectWebDav={() => {}} showLocalTab={true} />);
    expect(screen.getByText("Thought.Haus")).toBeInTheDocument();
  });

  it("renders the Open a Folder button when local tab is shown", () => {
    render(<Onboarding onOpenFolder={() => {}} onConnectWebDav={() => {}} showLocalTab={true} />);
    expect(
      screen.getByRole("button", { name: "Open a Folder" }),
    ).toBeInTheDocument();
  });

  it("calls onOpenFolder when button is clicked", () => {
    const onOpenFolder = vi.fn();
    render(<Onboarding onOpenFolder={onOpenFolder} onConnectWebDav={() => {}} showLocalTab={true} />);
    fireEvent.click(screen.getByRole("button", { name: "Open a Folder" }));
    expect(onOpenFolder).toHaveBeenCalledOnce();
  });

  it("shows WebDAV form when local tab is hidden", () => {
    render(<Onboarding onConnectWebDav={() => {}} showLocalTab={false} />);
    expect(screen.getByText("Server URL")).toBeInTheDocument();
    expect(screen.queryByText("Open a Folder")).not.toBeInTheDocument();
  });

  it("shows tabs when both backends are available", () => {
    render(<Onboarding onOpenFolder={() => {}} onConnectWebDav={() => {}} showLocalTab={true} />);
    expect(screen.getByText("Local Folder")).toBeInTheDocument();
    expect(screen.getByText("WebDAV Server")).toBeInTheDocument();
  });
});
