import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWebSearchStreamFn } from "./agent-runner.ts";
import { agentSettings, saveSettings } from "./agent-state.ts";

// Capture the onPayload callback from each streamSimple call
let lastPayload: Record<string, unknown> | undefined;

vi.mock("@mariozechner/pi-ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mariozechner/pi-ai")>();
  return {
    ...actual,
    streamSimple: vi.fn((_model: unknown, _context: unknown, options?: any) => {
      // Simulate the onPayload callback with a fake payload
      if (options?.onPayload) {
        const payload: Record<string, unknown> = {
          tools: [{ type: "function", name: "existing_tool" }],
        };
        options.onPayload(payload);
        lastPayload = payload;
      }
      return new actual.AssistantMessageEventStream();
    }),
  };
});

import { streamSimple } from "@mariozechner/pi-ai";
const streamSimpleMock = streamSimple as ReturnType<typeof vi.fn>;

const dummyModel = { id: "test", provider: "openai" } as any;
const dummyContext = { messages: [] } as any;

describe("createWebSearchStreamFn", () => {
  beforeEach(() => {
    streamSimpleMock.mockClear();
    lastPayload = undefined;
  });

  it("injects web_search_preview for OpenAI provider", () => {
    const streamFn = createWebSearchStreamFn("openai");
    streamFn(dummyModel, dummyContext, {});

    expect(streamSimpleMock).toHaveBeenCalledOnce();
    expect(lastPayload!.tools).toHaveLength(2);
    expect((lastPayload!.tools as unknown[])[1]).toEqual({
      type: "web_search_preview",
    });
  });

  it("injects web_search_20260209 for Anthropic provider", () => {
    const streamFn = createWebSearchStreamFn("anthropic");
    streamFn(dummyModel, dummyContext, {});

    expect(lastPayload!.tools).toHaveLength(2);
    expect((lastPayload!.tools as unknown[])[1]).toEqual({
      type: "web_search_20260209",
      name: "web_search",
    });
  });

  it("does not inject any search tool for unsupported providers", () => {
    const streamFn = createWebSearchStreamFn("groq");
    streamFn(dummyModel, dummyContext, {});

    expect(lastPayload!.tools).toHaveLength(1);
    expect((lastPayload!.tools as unknown[])[0]).toEqual({
      type: "function",
      name: "existing_tool",
    });
  });

  it("preserves existing tools in the payload", () => {
    const streamFn = createWebSearchStreamFn("openai");
    streamFn(dummyModel, dummyContext, {});

    expect((lastPayload!.tools as unknown[])[0]).toEqual({
      type: "function",
      name: "existing_tool",
    });
  });

  it("passes through other stream options", () => {
    const streamFn = createWebSearchStreamFn("openai");
    const signal = new AbortController().signal;
    streamFn(dummyModel, dummyContext, { temperature: 0.5, signal });

    const callArgs = streamSimpleMock.mock.calls[0];
    expect(callArgs[2]).toMatchObject({ temperature: 0.5, signal });
  });
});

describe("webSearchEnabled setting", () => {
  it("persists webSearchEnabled via saveSettings", () => {
    saveSettings({ ...agentSettings.value, webSearchEnabled: true });
    expect(agentSettings.value.webSearchEnabled).toBe(true);
  });

  it("can be toggled off after being enabled", () => {
    saveSettings({ ...agentSettings.value, webSearchEnabled: true });
    saveSettings({ ...agentSettings.value, webSearchEnabled: false });
    expect(agentSettings.value.webSearchEnabled).toBe(false);
  });
});
