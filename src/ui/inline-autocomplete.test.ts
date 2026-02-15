import { describe, it, expect, vi } from "vitest";
import { handleAutocompleteKeyDown } from "./inline-autocomplete.tsx";
import type { AutocompleteItem } from "./inline-autocomplete.tsx";

function makeEvent(key: string): KeyboardEvent {
  return new KeyboardEvent("keydown", { key });
}

const items: AutocompleteItem[] = [
  { label: "alpha" },
  { label: "beta", detail: "3" },
  { label: "gamma" },
];

function makeOpts(overrides: Partial<{
  items: AutocompleteItem[];
  highlightedIndex: number;
  onHighlightChange: (i: number) => void;
  onSelect: (item: AutocompleteItem, i: number) => void;
}> = {}) {
  return {
    items: overrides.items ?? items,
    highlightedIndex: overrides.highlightedIndex ?? -1,
    onHighlightChange: overrides.onHighlightChange ?? vi.fn(),
    onSelect: overrides.onSelect ?? vi.fn(),
  };
}

describe("handleAutocompleteKeyDown", () => {
  it("ArrowDown increments index and wraps from last to 0", () => {
    const onHighlightChange = vi.fn();

    // From -1 → 0
    let result = handleAutocompleteKeyDown(
      makeEvent("ArrowDown"),
      makeOpts({ highlightedIndex: -1, onHighlightChange }),
    );
    expect(result).toBe(true);
    expect(onHighlightChange).toHaveBeenCalledWith(0);

    onHighlightChange.mockClear();

    // From 1 → 2
    result = handleAutocompleteKeyDown(
      makeEvent("ArrowDown"),
      makeOpts({ highlightedIndex: 1, onHighlightChange }),
    );
    expect(result).toBe(true);
    expect(onHighlightChange).toHaveBeenCalledWith(2);

    onHighlightChange.mockClear();

    // Wraps: from 2 → 0
    result = handleAutocompleteKeyDown(
      makeEvent("ArrowDown"),
      makeOpts({ highlightedIndex: 2, onHighlightChange }),
    );
    expect(result).toBe(true);
    expect(onHighlightChange).toHaveBeenCalledWith(0);
  });

  it("ArrowUp decrements index and wraps from 0 to last", () => {
    const onHighlightChange = vi.fn();

    // From 2 → 1
    let result = handleAutocompleteKeyDown(
      makeEvent("ArrowUp"),
      makeOpts({ highlightedIndex: 2, onHighlightChange }),
    );
    expect(result).toBe(true);
    expect(onHighlightChange).toHaveBeenCalledWith(1);

    onHighlightChange.mockClear();

    // Wraps: from 0 → 2
    result = handleAutocompleteKeyDown(
      makeEvent("ArrowUp"),
      makeOpts({ highlightedIndex: 0, onHighlightChange }),
    );
    expect(result).toBe(true);
    expect(onHighlightChange).toHaveBeenCalledWith(2);

    onHighlightChange.mockClear();

    // From -1 wraps to last
    result = handleAutocompleteKeyDown(
      makeEvent("ArrowUp"),
      makeOpts({ highlightedIndex: -1, onHighlightChange }),
    );
    expect(result).toBe(true);
    expect(onHighlightChange).toHaveBeenCalledWith(2);
  });

  it("Enter with highlighted index calls onSelect and returns true", () => {
    const onSelect = vi.fn();
    const result = handleAutocompleteKeyDown(
      makeEvent("Enter"),
      makeOpts({ highlightedIndex: 1, onSelect }),
    );
    expect(result).toBe(true);
    expect(onSelect).toHaveBeenCalledWith({ label: "beta", detail: "3" }, 1);
  });

  it("Enter with index -1 returns false", () => {
    const onSelect = vi.fn();
    const result = handleAutocompleteKeyDown(
      makeEvent("Enter"),
      makeOpts({ highlightedIndex: -1, onSelect }),
    );
    expect(result).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("Tab selects highlighted item when highlighted", () => {
    const onSelect = vi.fn();
    const result = handleAutocompleteKeyDown(
      makeEvent("Tab"),
      makeOpts({ highlightedIndex: 2, onSelect }),
    );
    expect(result).toBe(true);
    expect(onSelect).toHaveBeenCalledWith({ label: "gamma" }, 2);
  });

  it("Tab selects first item when nothing highlighted", () => {
    const onSelect = vi.fn();
    const result = handleAutocompleteKeyDown(
      makeEvent("Tab"),
      makeOpts({ highlightedIndex: -1, onSelect }),
    );
    expect(result).toBe(true);
    expect(onSelect).toHaveBeenCalledWith({ label: "alpha" }, 0);
  });

  it("Tab returns false when no items", () => {
    const onSelect = vi.fn();
    const result = handleAutocompleteKeyDown(
      makeEvent("Tab"),
      makeOpts({ items: [], onSelect }),
    );
    expect(result).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("regular keys return false", () => {
    for (const key of ["a", "Backspace", "Shift", "Control"]) {
      const result = handleAutocompleteKeyDown(
        makeEvent(key),
        makeOpts(),
      );
      expect(result).toBe(false);
    }
  });
});
