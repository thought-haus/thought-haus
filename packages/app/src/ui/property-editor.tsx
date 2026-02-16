import { useState, useRef, useCallback, useEffect } from "preact/hooks";
import { allPropertyKeys } from "../notes/note-store.ts";
import { X, ChevronDown, ChevronRight } from "lucide-preact";
import { InlineAutocomplete, handleAutocompleteKeyDown } from "./inline-autocomplete.tsx";
import type { AutocompleteItem } from "./inline-autocomplete.tsx";
import styles from "./property-editor.module.css";
import autocompleteStyles from "./inline-autocomplete.module.css";

const RESERVED_KEYS = ["title", "date", "tags"];

interface PropertyEditorProps {
  noteId: string;
  properties: Record<string, string>;
  onUpdate: (properties: Record<string, string>) => void;
  triggerAdd?: boolean;
  onTriggerAddHandled?: () => void;
}

export function PropertyEditor({
  noteId,
  properties,
  onUpdate,
  triggerAdd,
  onTriggerAddHandled,
}: PropertyEditorProps) {
  const [addingProperty, setAddingProperty] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(`th:props-collapsed:${noteId}`) === "true";
    } catch { return false; }
  });
  const [autocompleteIndex, setAutocompleteIndex] = useState(-1);
  const [keyValidation, setKeyValidation] = useState<string | null>(null);

  const keyInputRef = useRef<HTMLInputElement>(null);
  const valueInputRef = useRef<HTMLInputElement>(null);

  const entries = Object.entries(properties);
  const count = entries.length;
  const showHeader = count >= 4;

  // Handle triggerAdd from parent (Cmd+;)
  useEffect(() => {
    if (triggerAdd) {
      setAddingProperty(true);
      if (collapsed) setCollapsed(false);
      onTriggerAddHandled?.();
    }
  }, [triggerAdd, collapsed, onTriggerAddHandled]);

  // Focus key input when adding starts
  useEffect(() => {
    if (addingProperty) {
      requestAnimationFrame(() => keyInputRef.current?.focus());
    }
  }, [addingProperty]);

  // Persist collapsed state
  useEffect(() => {
    if (showHeader) {
      try { localStorage.setItem(`th:props-collapsed:${noteId}`, String(collapsed)); } catch { /* */ }
    }
  }, [collapsed, noteId, showHeader]);

  // Reset collapsed when switching notes
  useEffect(() => {
    try {
      setCollapsed(
        localStorage.getItem(`th:props-collapsed:${noteId}`) === "true",
      );
    } catch {
      setCollapsed(false);
    }
    setAddingProperty(false);
    setEditingKey(null);
  }, [noteId]);

  const validateKey = useCallback(
    (key: string): string | null => {
      const trimmed = key.trim();
      if (!trimmed) return null;
      if (RESERVED_KEYS.includes(trimmed.toLowerCase())) {
        return `"${trimmed}" is managed above`;
      }
      if (trimmed in properties) {
        return `"${trimmed}" already exists`;
      }
      return null;
    },
    [properties],
  );

  const cancelAdding = useCallback(() => {
    setAddingProperty(false);
    setNewKey("");
    setNewValue("");
    setKeyValidation(null);
    setAutocompleteIndex(-1);
  }, []);

  const commitProperty = useCallback(() => {
    const trimmedKey = newKey.trim().replace(/:/g, "");
    if (!trimmedKey) {
      cancelAdding();
      return;
    }
    const validation = validateKey(trimmedKey);
    if (validation) {
      setKeyValidation(validation);
      return;
    }
    onUpdate({ ...properties, [trimmedKey]: newValue });
    // Start a new add row for rapid entry
    setNewKey("");
    setNewValue("");
    setKeyValidation(null);
    setAutocompleteIndex(-1);
    requestAnimationFrame(() => keyInputRef.current?.focus());
  }, [newKey, newValue, properties, onUpdate, validateKey, cancelAdding]);

  const removeProperty = useCallback(
    (key: string, focusIndex?: number) => {
      const { [key]: _, ...rest } = properties;
      onUpdate(rest);
      // Focus row above
      if (focusIndex !== undefined && focusIndex > 0) {
        const prevKey = Object.keys(properties)[focusIndex - 1];
        if (prevKey) {
          requestAnimationFrame(() => {
            const el = document.querySelector(
              `[data-property-key="${prevKey}"]`,
            ) as HTMLInputElement | null;
            el?.focus();
          });
        }
      }
    },
    [properties, onUpdate],
  );

  const updateProperty = useCallback(
    (key: string, value: string) => {
      onUpdate({ ...properties, [key]: value });
    },
    [properties, onUpdate],
  );

  const startEditing = useCallback(
    (key: string) => {
      setEditingKey(key);
      setEditDraft(properties[key] ?? "");
    },
    [properties],
  );

  const commitEdit = useCallback(
    (key: string) => {
      if (editDraft !== properties[key]) {
        updateProperty(key, editDraft);
      }
      setEditingKey(null);
    },
    [editDraft, properties, updateProperty],
  );

  const cancelEdit = useCallback(
    (key: string) => {
      setEditDraft(properties[key] ?? "");
      setEditingKey(null);
    },
    [properties],
  );

  // Autocomplete suggestions — only when typing (not on empty input)
  const allKeys = allPropertyKeys.value;
  const propertySuggestions: AutocompleteItem[] =
    addingProperty && newKey.length > 0
      ? allKeys
          .filter(
            (k) =>
              k.toLowerCase().startsWith(newKey.toLowerCase()) &&
              !(k in properties),
          )
          .map((k) => ({ label: k }))
      : [];

  const selectAutocompleteSuggestion = useCallback(
    (suggestion: string) => {
      setNewKey(suggestion);
      setKeyValidation(null);
      setAutocompleteIndex(-1);
      requestAnimationFrame(() => valueInputRef.current?.focus());
    },
    [],
  );

  const handleKeyInputKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelAdding();
        return;
      }
      // Delegate to shared autocomplete handler when suggestions exist
      if (propertySuggestions.length > 0) {
        const consumed = handleAutocompleteKeyDown(e, {
          items: propertySuggestions,
          highlightedIndex: autocompleteIndex,
          onHighlightChange: setAutocompleteIndex,
          onSelect: (item) => selectAutocompleteSuggestion(item.label),
        });
        if (consumed) {
          e.preventDefault();
          return;
        }
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const trimmed = newKey.trim().replace(/:/g, "");
        const validation = validateKey(trimmed);
        if (trimmed && !validation) {
          valueInputRef.current?.focus();
        } else if (validation) {
          setKeyValidation(validation);
        }
        return;
      }
      if (e.key === "Tab" && !e.shiftKey) {
        const trimmed = newKey.trim().replace(/:/g, "");
        const validation = validateKey(trimmed);
        if (trimmed && !validation) {
          e.preventDefault();
          valueInputRef.current?.focus();
        } else if (validation) {
          e.preventDefault();
          setKeyValidation(validation);
        }
      }
    },
    [
      cancelAdding,
      propertySuggestions,
      autocompleteIndex,
      newKey,
      validateKey,
      selectAutocompleteSuggestion,
    ],
  );

  const handleValueInputKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cancelAdding();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        commitProperty();
      }
    },
    [cancelAdding, commitProperty],
  );

  const handleExistingValueKeyDown = useCallback(
    (e: KeyboardEvent, key: string, index: number) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit(key);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit(key);
        (e.target as HTMLInputElement).blur();
        return;
      }
      if (
        e.key === "Backspace" &&
        (e.metaKey || e.ctrlKey)
      ) {
        e.preventDefault();
        removeProperty(key, index);
      }
    },
    [commitEdit, cancelEdit, removeProperty],
  );

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  // Nothing to render when empty and not adding
  if (count === 0 && !addingProperty) {
    return null;
  }

  return (
    <div class={styles.properties} role="group" aria-label="Note properties">
      {showHeader && (
        <button
          class={styles.sectionHeader}
          onClick={toggleCollapse}
          aria-expanded={!collapsed}
          aria-controls="properties-list"
          aria-label={`Properties (${count}), click to ${collapsed ? "expand" : "collapse"}`}
        >
          {collapsed ? (
            <ChevronRight size={10} />
          ) : (
            <ChevronDown size={10} />
          )}
          Properties ({count})
        </button>
      )}

      <div
        id="properties-list"
        role="list"
        class={`${styles.propertiesList} ${collapsed ? styles.propertiesListCollapsed : ""}`}
      >
        {entries.map(([key, value], index) => (
          <div
            key={key}
            class={styles.propertyRow}
            role="listitem"
            aria-label={`${key}: ${value}`}
          >
            <span
              class={styles.propertyKey}
              title={key}
              id={`prop-key-${key}`}
            >
              {key}
            </span>
            <input
              class={styles.propertyValue}
              type="text"
              value={editingKey === key ? editDraft : value}
              aria-labelledby={`prop-key-${key}`}
              data-property-key={key}
              onFocus={() => startEditing(key)}
              onInput={(e) => setEditDraft((e.target as HTMLInputElement).value)}
              onBlur={() => {
                if (editingKey === key) commitEdit(key);
              }}
              onKeyDown={(e) =>
                handleExistingValueKeyDown(e, key, index)
              }
            />
            <button
              class={styles.propertyRemove}
              onClick={() => removeProperty(key, index)}
              aria-label={`Remove property ${key}`}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {addingProperty && (
          <div class={`${styles.propertyRow} ${styles.propertyRowEntering}`} role="listitem" aria-label="New property">
            <div class={styles.keyInputWrapper}>
              <input
                ref={keyInputRef}
                class={styles.keyInput}
                type="text"
                value={newKey}
                placeholder="key"
                aria-label="Property name"
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value;
                  setNewKey(val);
                  setKeyValidation(null);
                  setAutocompleteIndex(-1);
                }}
                onKeyDown={handleKeyInputKeyDown}
                onBlur={(e) => {
                  // Don't cancel if clicking autocomplete or value input
                  const related = (e as FocusEvent).relatedTarget as HTMLElement | null;
                  if (
                    related &&
                    (related === valueInputRef.current ||
                      related.closest(`.${autocompleteStyles.autocomplete}`))
                  ) {
                    return;
                  }
                  if (!newKey.trim()) {
                    cancelAdding();
                  }
                }}
              />
              <InlineAutocomplete
                items={propertySuggestions}
                highlightedIndex={autocompleteIndex}
                onSelect={(item) => selectAutocompleteSuggestion(item.label)}
                onHighlightChange={setAutocompleteIndex}
              />
              {keyValidation && (
                <div class={styles.keyValidation}>{keyValidation}</div>
              )}
            </div>
            <input
              ref={valueInputRef}
              class={styles.valueInput}
              type="text"
              value={newValue}
              placeholder="value"
              aria-label="Property value"
              onInput={(e) =>
                setNewValue((e.target as HTMLInputElement).value)
              }
              onKeyDown={handleValueInputKeyDown}
              onBlur={() => {
                if (newKey.trim()) {
                  commitProperty();
                }
              }}
            />
          </div>
        )}
      </div>

    </div>
  );
}
