import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { WebDavForm } from "./webdav-form.tsx";

vi.mock("@thought-haus/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@thought-haus/core")>();
  return { ...actual, testWebDavConnection: vi.fn() };
});

import { testWebDavConnection } from "@thought-haus/core";

const mockTestConnection = vi.mocked(testWebDavConnection);

describe("WebDavForm", () => {
  beforeEach(() => {
    mockTestConnection.mockReset();
  });

  it("renders Server URL, Username, and Password fields", () => {
    render(<WebDavForm onConnect={() => {}} />);
    expect(screen.getByText("Server URL")).toBeInTheDocument();
    expect(screen.getByText("Username")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
  });

  it("renders Test Connection and Connect buttons", () => {
    render(<WebDavForm onConnect={() => {}} />);
    expect(screen.getByRole("button", { name: "Test Connection" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
  });

  it("disables Connect button initially", () => {
    render(<WebDavForm onConnect={() => {}} />);
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
  });

  it("disables Test Connection button when fields are empty", () => {
    render(<WebDavForm onConnect={() => {}} />);
    expect(screen.getByRole("button", { name: "Test Connection" })).toBeDisabled();
  });

  it("enables Test Connection button when all fields are filled", () => {
    render(<WebDavForm onConnect={() => {}} />);
    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "http://localhost:8080/" },
    });
    fireEvent.input(screen.getByPlaceholderText("username"), {
      target: { value: "noti" },
    });
    fireEvent.input(screen.getByPlaceholderText("password"), {
      target: { value: "notidev" },
    });
    expect(screen.getByRole("button", { name: "Test Connection" })).not.toBeDisabled();
  });

  it("shows 'Connection successful' after successful test", async () => {
    mockTestConnection.mockResolvedValueOnce({ ok: true });
    render(<WebDavForm onConnect={() => {}} />);

    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "http://localhost:8080/" },
    });
    fireEvent.input(screen.getByPlaceholderText("username"), {
      target: { value: "noti" },
    });
    fireEvent.input(screen.getByPlaceholderText("password"), {
      target: { value: "notidev" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Test Connection" }));

    await waitFor(() => {
      expect(screen.getByText("Connection successful")).toBeInTheDocument();
    });
  });

  it("enables Connect button after successful test", async () => {
    mockTestConnection.mockResolvedValueOnce({ ok: true });
    render(<WebDavForm onConnect={() => {}} />);

    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "http://localhost:8080/" },
    });
    fireEvent.input(screen.getByPlaceholderText("username"), {
      target: { value: "noti" },
    });
    fireEvent.input(screen.getByPlaceholderText("password"), {
      target: { value: "notidev" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Test Connection" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Connect" })).not.toBeDisabled();
    });
  });

  it("shows CORS error message on cors failure", async () => {
    mockTestConnection.mockResolvedValueOnce({ ok: false, error: "cors" });
    render(<WebDavForm onConnect={() => {}} />);

    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "http://localhost:8080/" },
    });
    fireEvent.input(screen.getByPlaceholderText("username"), {
      target: { value: "noti" },
    });
    fireEvent.input(screen.getByPlaceholderText("password"), {
      target: { value: "notidev" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Test Connection" }));

    await waitFor(() => {
      expect(screen.getByText(/CORS error/)).toBeInTheDocument();
    });
  });

  it("shows auth error message on auth failure", async () => {
    mockTestConnection.mockResolvedValueOnce({ ok: false, error: "auth" });
    render(<WebDavForm onConnect={() => {}} />);

    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "http://localhost:8080/" },
    });
    fireEvent.input(screen.getByPlaceholderText("username"), {
      target: { value: "noti" },
    });
    fireEvent.input(screen.getByPlaceholderText("password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Test Connection" }));

    await waitFor(() => {
      expect(screen.getByText(/Authentication failed/)).toBeInTheDocument();
    });
  });

  it("shows not_found error message", async () => {
    mockTestConnection.mockResolvedValueOnce({ ok: false, error: "not_found" });
    render(<WebDavForm onConnect={() => {}} />);

    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "http://localhost:8080/bad" },
    });
    fireEvent.input(screen.getByPlaceholderText("username"), {
      target: { value: "noti" },
    });
    fireEvent.input(screen.getByPlaceholderText("password"), {
      target: { value: "notidev" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Test Connection" }));

    await waitFor(() => {
      expect(screen.getByText(/Server URL not found/)).toBeInTheDocument();
    });
  });

  it("calls onConnect with trimmed config on Connect click", async () => {
    mockTestConnection.mockResolvedValueOnce({ ok: true });
    const onConnect = vi.fn();
    render(<WebDavForm onConnect={onConnect} />);

    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "  http://localhost:8080/  " },
    });
    fireEvent.input(screen.getByPlaceholderText("username"), {
      target: { value: "  noti  " },
    });
    fireEvent.input(screen.getByPlaceholderText("password"), {
      target: { value: "notidev" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Test Connection" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Connect" })).not.toBeDisabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(onConnect).toHaveBeenCalledWith({
      url: "http://localhost:8080/",
      username: "noti",
      password: "notidev",
    });
  });

  it("resets test result when URL input changes", async () => {
    mockTestConnection.mockResolvedValueOnce({ ok: true });
    render(<WebDavForm onConnect={() => {}} />);

    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "http://localhost:8080/" },
    });
    fireEvent.input(screen.getByPlaceholderText("username"), {
      target: { value: "noti" },
    });
    fireEvent.input(screen.getByPlaceholderText("password"), {
      target: { value: "notidev" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Test Connection" }));
    await waitFor(() => {
      expect(screen.getByText("Connection successful")).toBeInTheDocument();
    });

    // Change URL — should reset test result
    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "http://other-host:8080/" },
    });
    expect(screen.queryByText("Connection successful")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect" })).toBeDisabled();
  });

  it("shows Testing... while test is in progress", async () => {
    let resolveTest: (v: { ok: true }) => void;
    mockTestConnection.mockReturnValueOnce(
      new Promise((resolve) => { resolveTest = resolve; }),
    );
    render(<WebDavForm onConnect={() => {}} />);

    fireEvent.input(screen.getByPlaceholderText("https://example.com/webdav/"), {
      target: { value: "http://localhost:8080/" },
    });
    fireEvent.input(screen.getByPlaceholderText("username"), {
      target: { value: "noti" },
    });
    fireEvent.input(screen.getByPlaceholderText("password"), {
      target: { value: "notidev" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Test Connection" }));

    await waitFor(() => {
      expect(screen.getByText("Testing...")).toBeInTheDocument();
    });
    resolveTest!({ ok: true });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Test Connection" })).toBeInTheDocument();
    });
  });

  it("toggles password visibility", () => {
    render(<WebDavForm onConnect={() => {}} />);
    const passwordInput = screen.getByPlaceholderText("password");
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("uses initialUrl prop when provided", () => {
    render(<WebDavForm onConnect={() => {}} initialUrl="http://preset:8080/" />);
    const urlInput = screen.getByPlaceholderText("https://example.com/webdav/") as HTMLInputElement;
    expect(urlInput.value).toBe("http://preset:8080/");
  });
});
