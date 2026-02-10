import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/preact";
import { RePermission } from "./re-permission.tsx";

describe("RePermission", () => {
  it("shows the folder name", () => {
    render(
      <RePermission
        folderName="my-notes"
        onReopen={() => {}}
        onPickNew={() => {}}
      />,
    );
    expect(screen.getByText("my-notes")).toBeInTheDocument();
  });

  it("renders the re-open button with folder name", () => {
    render(
      <RePermission
        folderName="my-notes"
        onReopen={() => {}}
        onPickNew={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Re-open my-notes" }),
    ).toBeInTheDocument();
  });

  it("calls onReopen when re-open button is clicked", () => {
    const onReopen = vi.fn();
    render(
      <RePermission
        folderName="my-notes"
        onReopen={onReopen}
        onPickNew={() => {}}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Re-open my-notes" }),
    );
    expect(onReopen).toHaveBeenCalledOnce();
  });

  it("calls onPickNew when different folder link is clicked", () => {
    const onPickNew = vi.fn();
    render(
      <RePermission
        folderName="my-notes"
        onReopen={() => {}}
        onPickNew={onPickNew}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Or choose a different folder" }),
    );
    expect(onPickNew).toHaveBeenCalledOnce();
  });
});
