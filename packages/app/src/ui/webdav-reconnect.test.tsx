import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { WebDavReconnect } from "./webdav-reconnect.tsx";

describe("WebDavReconnect", () => {
  it("renders the server URL", () => {
    render(
      <WebDavReconnect
        serverUrl="http://localhost:8080/webdav/"
        onReconnect={() => {}}
        onChangeServer={() => {}}
      />,
    );
    expect(screen.getByText("http://localhost:8080/webdav/")).toBeInTheDocument();
  });

  it("renders the Reconnect title", () => {
    render(
      <WebDavReconnect
        serverUrl="http://example.com/"
        onReconnect={() => {}}
        onChangeServer={() => {}}
      />,
    );
    expect(screen.getByRole("heading", { name: "Reconnect" })).toBeInTheDocument();
  });

  it("renders the Reconnect button", () => {
    render(
      <WebDavReconnect
        serverUrl="http://example.com/"
        onReconnect={() => {}}
        onChangeServer={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Reconnect" })).toBeInTheDocument();
  });

  it("renders the Change server button", () => {
    render(
      <WebDavReconnect
        serverUrl="http://example.com/"
        onReconnect={() => {}}
        onChangeServer={() => {}}
      />,
    );
    expect(screen.getByText("Change server")).toBeInTheDocument();
  });

  it("calls onReconnect when Reconnect button is clicked", async () => {
    const onReconnect = vi.fn(() => Promise.resolve());
    render(
      <WebDavReconnect
        serverUrl="http://example.com/"
        onReconnect={onReconnect}
        onChangeServer={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }));
    await waitFor(() => {
      expect(onReconnect).toHaveBeenCalledOnce();
    });
  });

  it("shows Reconnecting... while reconnecting", async () => {
    let resolveReconnect: () => void;
    const onReconnect = vi.fn(
      () => new Promise<void>((resolve) => { resolveReconnect = resolve; }),
    );
    render(
      <WebDavReconnect
        serverUrl="http://example.com/"
        onReconnect={onReconnect}
        onChangeServer={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }));
    await waitFor(() => {
      expect(screen.getByText("Reconnecting...")).toBeInTheDocument();
    });
    resolveReconnect!();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reconnect" })).toBeInTheDocument();
    });
  });

  it("calls onChangeServer when Change server is clicked", () => {
    const onChangeServer = vi.fn();
    render(
      <WebDavReconnect
        serverUrl="http://example.com/"
        onReconnect={() => {}}
        onChangeServer={onChangeServer}
      />,
    );
    fireEvent.click(screen.getByText("Change server"));
    expect(onChangeServer).toHaveBeenCalledOnce();
  });

  it("disables the Reconnect button while reconnecting", async () => {
    let resolveReconnect: () => void;
    const onReconnect = vi.fn(
      () => new Promise<void>((resolve) => { resolveReconnect = resolve; }),
    );
    render(
      <WebDavReconnect
        serverUrl="http://example.com/"
        onReconnect={onReconnect}
        onChangeServer={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }));
    await waitFor(() => {
      expect(screen.getByText("Reconnecting...")).toBeDisabled();
    });
    resolveReconnect!();
  });
});
