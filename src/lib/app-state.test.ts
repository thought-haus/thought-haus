import { describe, it, expect, beforeEach } from "vitest";
import {
  appView,
  isBrowserCompatible,
  showMainLayout,
} from "./app-state.ts";

describe("app-state", () => {
  beforeEach(() => {
    appView.value = "onboarding";
    isBrowserCompatible.value = true;
  });

  it("defaults to onboarding view", () => {
    expect(appView.value).toBe("onboarding");
  });

  it("showMainLayout is false during onboarding", () => {
    expect(showMainLayout.value).toBe(false);
  });

  it("showMainLayout is true when view is main and browser is compatible", () => {
    appView.value = "main";
    expect(showMainLayout.value).toBe(true);
  });

  it("showMainLayout is false when browser is incompatible", () => {
    appView.value = "main";
    isBrowserCompatible.value = false;
    expect(showMainLayout.value).toBe(false);
  });
});
