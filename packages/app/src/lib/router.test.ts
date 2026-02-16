import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { selectedNoteId } from "./app-state.ts";
import { setNotes } from "../notes/note-store.ts";
import { readHash, startRouter, applyPendingHash, stopRouter } from "./router.ts";
import type { Note } from "@thought-haus/core";

function makeNote(id: string): Note {
  return {
    id,
    title: id,
    tags: [],
    properties: {},
    filename: `${id}.md`,
    createdAt: new Date(),
    lastModified: Date.now(),
    size: 0,
    isTimestampFormat: true,
  };
}

async function flushMicrotasks(): Promise<void> {
  await new Promise<void>((r) => queueMicrotask(r));
}

describe("router", () => {
  beforeEach(() => {
    selectedNoteId.value = null;
    history.replaceState(null, "", window.location.pathname);
    setNotes([makeNote("note-1"), makeNote("note-2")]);
  });

  afterEach(() => {
    stopRouter();
    selectedNoteId.value = null;
    history.replaceState(null, "", window.location.pathname);
    setNotes([]);
  });

  describe("readHash", () => {
    it("returns null for empty hash", () => {
      history.replaceState(null, "", window.location.pathname);
      expect(readHash()).toBeNull();
    });

    it("strips # prefix and returns the ID", () => {
      history.replaceState(null, "", "#note-1");
      expect(readHash()).toBe("note-1");
    });
  });

  describe("signal to URL sync", () => {
    it("updates hash when selectedNoteId changes", async () => {
      startRouter();
      await flushMicrotasks();

      selectedNoteId.value = "note-1";
      expect(window.location.hash).toBe("#note-1");
    });

    it("clears hash when selectedNoteId is set to null", async () => {
      startRouter();
      await flushMicrotasks();

      selectedNoteId.value = "note-1";
      await flushMicrotasks();

      selectedNoteId.value = null;
      expect(window.location.hash).toBe("");
    });
  });

  describe("URL to signal sync", () => {
    it("updates signal on popstate with valid note", async () => {
      startRouter();
      await flushMicrotasks();

      history.pushState(null, "", "#note-2");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await flushMicrotasks();

      expect(selectedNoteId.value).toBe("note-2");
    });

    it("clears hash on popstate with invalid note", async () => {
      startRouter();
      await flushMicrotasks();

      history.pushState(null, "", "#nonexistent");
      window.dispatchEvent(new PopStateEvent("popstate"));
      await flushMicrotasks();

      expect(selectedNoteId.value).toBeNull();
      expect(window.location.hash).toBe("");
    });
  });

  describe("applyPendingHash", () => {
    it("selects note from initial hash", async () => {
      history.replaceState(null, "", "#note-1");
      startRouter();
      await flushMicrotasks();

      applyPendingHash();
      expect(selectedNoteId.value).toBe("note-1");
    });

    it("clears invalid initial hash", async () => {
      history.replaceState(null, "", "#nonexistent");
      startRouter();
      await flushMicrotasks();

      applyPendingHash();
      expect(window.location.hash).toBe("");
    });

    it("is a no-op without a hash", async () => {
      startRouter();
      await flushMicrotasks();

      applyPendingHash();
      expect(selectedNoteId.value).toBeNull();
    });

    it("only fires once", async () => {
      history.replaceState(null, "", "#note-1");
      startRouter();
      await flushMicrotasks();

      applyPendingHash();
      expect(selectedNoteId.value).toBe("note-1");

      selectedNoteId.value = null;
      applyPendingHash();
      expect(selectedNoteId.value).toBeNull();
    });
  });

  describe("circular update prevention", () => {
    it("does not loop between signal and hash", async () => {
      startRouter();
      await flushMicrotasks();

      const pushSpy = vi.spyOn(history, "pushState");
      selectedNoteId.value = "note-1";
      await flushMicrotasks();

      // pushState called once for the signal change, not again from the hash listener
      const callCount = pushSpy.mock.calls.length;
      expect(callCount).toBe(1);
      pushSpy.mockRestore();
    });
  });

  describe("stopRouter", () => {
    it("disables syncing after stop", async () => {
      startRouter();
      await flushMicrotasks();

      stopRouter();
      selectedNoteId.value = "note-1";
      expect(window.location.hash).toBe("");
    });
  });
});
