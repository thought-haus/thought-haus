import { useEffect, useRef, useCallback, useState } from "preact/hooks";
import { selectedNoteId, storageBackend } from "../lib/app-state.ts";
import { getNote, upsertNote, tagCounts } from "../notes/note-store.ts";
import { parseFrontMatter, serializeFrontMatter } from "../notes/frontmatter.ts";
import { createEditor } from "../editor/tiptap-editor.ts";
import { saveStatus, wordCount, countWords } from "../editor/editor-state.ts";
import { debounce } from "../lib/debounce.ts";
import { updateInIndex } from "../search/search-engine.ts";
import { renameNote } from "../notes/note-actions.ts";
import { saveAttachment } from "../attachments/attachment-service.ts";
import { isFavorite, toggleFavorite } from "../favorites/favorite-store.ts";
import { InlineAutocomplete, handleAutocompleteKeyDown } from "./inline-autocomplete.tsx";
import { X, Paperclip, Star } from "lucide-preact";
import type { Editor } from "@tiptap/core";
import styles from "./editor-view.module.css";
import { PropertyEditor } from "./property-editor.tsx";

interface EditorViewProps {
  onDelete?: () => void;
}

export function EditorView_({ onDelete }: EditorViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const bodyRef = useRef("");
  const noteIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagHighlight, setTagHighlight] = useState(-1);
  const [titleDraft, setTitleDraft] = useState("");
  const [triggerAddProperty, setTriggerAddProperty] = useState(false);

  const handleFiles = useCallback(async (files: File[], pos?: number) => {
    const noteId = noteIdRef.current;
    if (!noteId) return;
    const note = getNote(noteId);
    if (!note) return;
    const editor = editorInstanceRef.current;
    if (!editor) return;

    for (const file of files) {
      try {
        const result = await saveAttachment(note, file);
        const insertPos = pos ?? editor.state.selection.from;
        if (result.isImage) {
          editor.chain().focus().insertContentAt(insertPos, {
            type: "image",
            attrs: { src: result.relativePath, alt: result.originalName },
          }).run();
        } else {
          editor.chain().focus().insertContentAt(insertPos, {
            type: "attachmentCard",
            attrs: { href: result.relativePath, label: result.originalName },
          }).run();
        }
      } catch {
        // ignore individual file errors
      }
    }
  }, []);

  const saveNote = useCallback(async () => {
    const noteId = noteIdRef.current;
    if (!noteId) return;
    const note = getNote(noteId);
    if (!note) return;

    // Serialize markdown from TipTap at save time (not on every keystroke)
    const editor = editorInstanceRef.current;
    if (editor) {
      bodyRef.current = editor.getMarkdown();
    }

    saveStatus.value = "saving";
    try {
      const backend = storageBackend.value;
      if (!backend) { saveStatus.value = "unsaved"; return; }
      const content = serializeFrontMatter(
        {
          title: note.title,
          date: note.createdAt.toISOString().replace("Z", ""),
          tags: note.tags,
          properties: note.properties,
        },
        bodyRef.current,
      );
      const meta = await backend.write(note.filename, content);
      upsertNote({ ...note, lastModified: meta.lastModified, size: meta.size });
      updateInIndex({
        id: note.id,
        title: note.title,
        tags: note.tags,
        body: bodyRef.current,
        lastModified: meta.lastModified,
      });
      saveStatus.value = "saved";
    } catch {
      saveStatus.value = "unsaved";
    }
  }, []);

  const debouncedSave = useRef(debounce(() => saveNote(), 1500));

  // Load note content when selection changes
  useEffect(() => {
    const noteId = selectedNoteId.value;
    noteIdRef.current = noteId;

    if (!noteId) {
      saveStatus.value = "idle";
      wordCount.value = 0;
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
      return;
    }

    const note = getNote(noteId);
    if (!note) return;

    setTitleDraft(note.title);

    (async () => {
      const backend = storageBackend.value;
      if (!backend) return;
      const rawContent = await backend.read(note.filename);
      const { body } = parseFrontMatter(rawContent);
      bodyRef.current = body;
      wordCount.value = countWords(body);
      saveStatus.value = "saved";

      // Destroy old editor
      if (editorInstanceRef.current) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }

      if (!containerRef.current) return;

      editorInstanceRef.current = createEditor({
        parent: containerRef.current,
        content: body,
        onChange: (text) => {
          wordCount.value = countWords(text);
          saveStatus.value = "unsaved";
          debouncedSave.current();
        },
        onFileDrop: (files, pos) => handleFiles(files, pos),
      });
    })();

    return () => {
      debouncedSave.current.cancel();
    };
  }, [selectedNoteId.value]);

  // Save on blur
  useEffect(() => {
    const handleBlur = () => {
      if (saveStatus.value === "unsaved") {
        debouncedSave.current.cancel();
        saveNote();
      }
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [saveNote]);

  // Best-effort save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveStatus.value === "unsaved") {
        debouncedSave.current.cancel();
        saveNote();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveNote]);

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
      if (!tag) return;
      const noteId = noteIdRef.current;
      if (!noteId) return;
      const note = getNote(noteId);
      if (!note) return;
      if (note.tags.includes(tag)) return;

      upsertNote({ ...note, tags: [...note.tags, tag] });
      setTagInput("");
      setShowTagInput(false);
      setTagHighlight(-1);
      saveNote();
    },
    [saveNote],
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      const noteId = noteIdRef.current;
      if (!noteId) return;
      const note = getNote(noteId);
      if (!note) return;

      upsertNote({ ...note, tags: note.tags.filter((t) => t !== tagToRemove) });
      saveNote();
    },
    [saveNote],
  );

  const updateProperties = useCallback(
    (properties: Record<string, string>) => {
      const noteId = noteIdRef.current;
      if (!noteId) return;
      const note = getNote(noteId);
      if (!note) return;
      upsertNote({ ...note, properties });
      saveNote();
    },
    [saveNote],
  );

  const commitTitle = useCallback(async () => {
    const noteId = noteIdRef.current;
    if (!noteId) return;
    const note = getNote(noteId);
    if (!note) return;
    const trimmed = titleDraft.trim() || "Untitled";
    if (trimmed === note.title) {
      setTitleDraft(note.title);
      return;
    }
    await renameNote(noteId, trimmed);
    setTitleDraft(trimmed);
  }, [titleDraft]);

  // handleTagKeyDown is defined inline in JSX to capture tagSuggestions from render scope

  // Cmd/Ctrl+; to add property
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ";" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setTriggerAddProperty(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const noteId = selectedNoteId.value;
  const note = noteId ? getNote(noteId) : null;

  if (!note) {
    return (
      <main class={styles.editor}>
        <div class={styles.placeholder}>
          <p>Select a note or create a new one</p>
        </div>
      </main>
    );
  }

  const favorited = isFavorite(note.id);

  const tagSuggestions =
    showTagInput && tagInput.length > 0
      ? Array.from(tagCounts.value.keys())
          .sort()
          .filter(
            (t) =>
              t.startsWith(tagInput.toLowerCase()) && !note.tags.includes(t),
          )
          .slice(0, 20)
          .map((t) => ({ label: t, detail: `${tagCounts.value.get(t)}` }))
      : [];

  return (
    <main class={styles.editor}>
      <div class={styles.header}>
        <div class={styles.titleRow}>
          <button
            class={`${styles.starBtn} ${favorited ? styles.starBtnActive : ""}`}
            onClick={() => toggleFavorite(note.id)}
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorited}
            title={`${favorited ? "Remove from" : "Add to"} favorites (${navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Shift+F)`}
          >
            <Star size={16} fill={favorited ? "currentColor" : "none"} />
          </button>
          <input
            class={styles.titleInput}
            type="text"
            value={titleDraft}
            onInput={(e) =>
              setTitleDraft((e.target as HTMLInputElement).value)
            }
            onBlur={() => commitTitle()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            aria-label="Note title"
          />
          <div class={styles.headerActions}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              class={styles.hiddenFileInput}
              onChange={(e) => {
                const files = Array.from((e.target as HTMLInputElement).files ?? []);
                if (files.length > 0) handleFiles(files);
                (e.target as HTMLInputElement).value = "";
              }}
            />
            <button
              class={styles.attachBtn}
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
              aria-label="Attach file"
            >
              <Paperclip size={14} />
              Attach
            </button>
            {onDelete && (
              <button
                class={styles.deleteBtn}
                onClick={onDelete}
                title="Delete note"
                aria-label="Delete note"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <div class={styles.metadata}>
          <div class={styles.tags}>
            {note.tags.map((tag) => (
              <span key={tag} class={styles.tagPill}>
                {tag}
                <button
                  class={styles.tagRemove}
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {showTagInput ? (
              <div class={styles.tagInputWrapper}>
                <input
                  class={styles.tagInput}
                  type="text"
                  value={tagInput}
                  placeholder="tag name"
                  aria-label="Add tag"
                  autoFocus
                  onInput={(e) => {
                    setTagInput((e.target as HTMLInputElement).value);
                    setTagHighlight(-1);
                  }}
                  onKeyDown={(e) => {
                    if (tagSuggestions.length > 0) {
                      const consumed = handleAutocompleteKeyDown(e, {
                        items: tagSuggestions,
                        highlightedIndex: tagHighlight,
                        onHighlightChange: setTagHighlight,
                        onSelect: (item) => addTag(item.label),
                      });
                      if (consumed) {
                        e.preventDefault();
                        return;
                      }
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag((e.target as HTMLInputElement).value);
                    } else if (e.key === "Escape") {
                      setTagInput("");
                      setShowTagInput(false);
                      setTagHighlight(-1);
                    }
                  }}
                  onBlur={() => {
                    if (tagInput.trim()) {
                      addTag(tagInput);
                    } else {
                      setShowTagInput(false);
                    }
                  }}
                />
                <InlineAutocomplete
                  items={tagSuggestions}
                  highlightedIndex={tagHighlight}
                  onSelect={(item) => addTag(item.label)}
                  onHighlightChange={setTagHighlight}
                />
              </div>
            ) : (
              <button
                class={styles.addTagBtn}
                onClick={() => setShowTagInput(true)}
                aria-label="Add tag"
              >
                + tag
              </button>
            )}
          </div>
          <span class={styles.date}>
            {note.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <button
            class={styles.addPropertyBtn}
            onClick={() => setTriggerAddProperty(true)}
            aria-label="Add property"
          >
            + property
          </button>
        </div>
        <PropertyEditor
          noteId={note.id}
          properties={note.properties}
          onUpdate={updateProperties}
          triggerAdd={triggerAddProperty}
          onTriggerAddHandled={() => setTriggerAddProperty(false)}
        />
      </div>
      <div class={styles.editorBody} ref={containerRef} />
      <div class={styles.statusBar}>
        <span>{wordCount.value} words</span>
        <span class={styles.saveIndicator}>
          {saveStatus.value === "saved" && "Saved"}
          {saveStatus.value === "saving" && "Saving..."}
          {saveStatus.value === "unsaved" && "Unsaved"}
        </span>
      </div>
    </main>
  );
}

// Re-export with proper name
export { EditorView_ as EditorView };
