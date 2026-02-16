import { useEffect, useRef } from "preact/hooks";
import styles from "./inline-autocomplete.module.css";

export interface AutocompleteItem {
  label: string;
  detail?: string;
}

interface InlineAutocompleteProps {
  items: AutocompleteItem[];
  highlightedIndex: number;
  onSelect: (item: AutocompleteItem, index: number) => void;
  onHighlightChange: (index: number) => void;
  className?: string;
}

export function InlineAutocomplete({
  items,
  highlightedIndex,
  onSelect,
  onHighlightChange,
  className,
}: InlineAutocompleteProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const active = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  if (items.length === 0) return null;

  return (
    <div
      ref={listRef}
      class={`${styles.autocomplete}${className ? ` ${className}` : ""}`}
      role="listbox"
    >
      {items.map((item, i) => (
        <div
          key={item.label}
          class={`${styles.item}${i === highlightedIndex ? ` ${styles.itemActive}` : ""}`}
          role="option"
          aria-selected={i === highlightedIndex}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item, i);
          }}
          onMouseEnter={() => onHighlightChange(i)}
        >
          {item.label}
          {item.detail && <span class={styles.itemDetail}>{item.detail}</span>}
        </div>
      ))}
    </div>
  );
}

export function handleAutocompleteKeyDown(
  e: KeyboardEvent,
  opts: {
    items: AutocompleteItem[];
    highlightedIndex: number;
    onHighlightChange: (index: number) => void;
    onSelect: (item: AutocompleteItem, index: number) => void;
  },
): boolean {
  const { items, highlightedIndex, onHighlightChange, onSelect } = opts;

  if (e.key === "ArrowDown") {
    const next = (highlightedIndex + 1) % items.length;
    onHighlightChange(next);
    return true;
  }

  if (e.key === "ArrowUp") {
    const next = highlightedIndex <= 0 ? items.length - 1 : highlightedIndex - 1;
    onHighlightChange(next);
    return true;
  }

  if (e.key === "Enter") {
    if (highlightedIndex >= 0 && items[highlightedIndex]) {
      onSelect(items[highlightedIndex], highlightedIndex);
      return true;
    }
    return false;
  }

  if (e.key === "Tab") {
    if (items.length === 0) return false;
    const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
    onSelect(items[idx], idx);
    return true;
  }

  return false;
}
