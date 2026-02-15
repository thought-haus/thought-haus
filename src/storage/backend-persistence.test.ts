import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  saveWebDavConfig,
  loadWebDavConfig,
  saveActiveBackendType,
  loadActiveBackendType,
  clearBackendConfig,
} from "./backend-persistence.ts";

// Mock the db module
const mockStore = new Map<string, unknown>();

vi.mock("../lib/db.ts", () => ({
  openDB: () => {
    const objectStore = {
      put: (value: unknown, key: string) => {
        mockStore.set(key, value);
        return { onsuccess: null, onerror: null };
      },
      get: (key: string) => {
        const result = mockStore.get(key);
        const req = { result, onsuccess: null as (() => void) | null, onerror: null as (() => void) | null };
        setTimeout(() => req.onsuccess?.(), 0);
        return req;
      },
      clear: () => {
        mockStore.clear();
        return { onsuccess: null, onerror: null };
      },
    };

    return Promise.resolve({
      transaction: (_store: string, _mode: string) => {
        const tx = {
          objectStore: () => objectStore,
          oncomplete: null as (() => void) | null,
          onerror: null as (() => void) | null,
        };
        // Fire oncomplete asynchronously after put/clear
        setTimeout(() => tx.oncomplete?.(), 0);
        return tx;
      },
    });
  },
}));

describe("backend-persistence", () => {
  beforeEach(() => {
    mockStore.clear();
  });

  describe("saveWebDavConfig / loadWebDavConfig", () => {
    it("saves and loads WebDAV config", async () => {
      const config = { url: "http://localhost:8080/", username: "noti", password: "dev" };
      await saveWebDavConfig(config);
      const loaded = await loadWebDavConfig();
      expect(loaded).toEqual(config);
    });

    it("returns null when no config is saved", async () => {
      const loaded = await loadWebDavConfig();
      expect(loaded).toBeNull();
    });
  });

  describe("saveActiveBackendType / loadActiveBackendType", () => {
    it("saves and loads backend type", async () => {
      await saveActiveBackendType("webdav");
      const loaded = await loadActiveBackendType();
      expect(loaded).toBe("webdav");
    });

    it("saves and loads local backend type", async () => {
      await saveActiveBackendType("local");
      const loaded = await loadActiveBackendType();
      expect(loaded).toBe("local");
    });

    it("returns null when no type is saved", async () => {
      const loaded = await loadActiveBackendType();
      expect(loaded).toBeNull();
    });
  });

  describe("clearBackendConfig", () => {
    it("clears all backend config", async () => {
      await saveWebDavConfig({ url: "http://test/", username: "u", password: "p" });
      await saveActiveBackendType("webdav");
      await clearBackendConfig();

      const config = await loadWebDavConfig();
      const backendType = await loadActiveBackendType();
      expect(config).toBeNull();
      expect(backendType).toBeNull();
    });
  });
});
