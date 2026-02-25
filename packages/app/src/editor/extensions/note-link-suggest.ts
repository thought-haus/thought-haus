import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { notesSorted } from "../../notes/note-store.ts";
import { createNote } from "../../notes/note-actions.ts";
import type { Note } from "@thought-haus/core";

type CreateOption = { __isCreate: true; title: string };
type SuggestionItem = Note | CreateOption;

function isCreate(item: SuggestionItem): item is CreateOption {
  return "__isCreate" in item;
}

export const noteLinkSuggestion: Omit<SuggestionOptions<SuggestionItem>, "editor"> = {
  char: "[[",
  allowSpaces: true,

  items({ query }) {
    const q = query.toLowerCase().trim();
    const matches = notesSorted.value
      .filter((n) => !q || n.title.toLowerCase().includes(q))
      .slice(0, 50);
    return [
      ...matches,
      ...(q ? [{ __isCreate: true as const, title: query.trim() }] : []),
    ];
  },

  command({ editor, range, props }) {
    if (isCreate(props)) {
      // Delete the [[...query text, then create the note and insert the link
      editor.chain().focus().deleteRange(range).run();
      createNote(props.title, false).then((note) => {
        if (note) {
          editor
            .chain()
            .focus()
            .insertContent({ type: "noteLink", attrs: { noteId: note.id } })
            .run();
        }
      });
    } else {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: "noteLink", attrs: { noteId: props.id } })
        .run();
    }
  },

  render() {
    let popup: HTMLDivElement | null = null;
    let selectedIndex = 0;
    let items: SuggestionItem[] = [];

    function buildList() {
      if (!popup) return;
      popup.innerHTML = "";

      if (items.length === 0) {
        const empty = document.createElement("div");
        empty.className = "note-link-suggest-empty";
        empty.textContent = "No matching notes";
        popup.appendChild(empty);
        return;
      }

      items.forEach((item, index) => {
        const btn = document.createElement("button");
        const selected = index === selectedIndex;

        if (isCreate(item)) {
          btn.className =
            "note-link-suggest-create" + (selected ? " is-selected" : "");
          btn.textContent = `+ New note: "${item.title}"`;
        } else {
          btn.className =
            "note-link-suggest-item" + (selected ? " is-selected" : "");
          btn.textContent = item.title;
        }

        btn.addEventListener("mousedown", (e) => {
          e.preventDefault();
        });
        btn.addEventListener("click", () => {
          selectItem(index);
        });
        popup!.appendChild(btn);
      });

      const selectedEl = popup.querySelector(".is-selected");
      if (selectedEl) selectedEl.scrollIntoView({ block: "nearest" });
    }

    let commandFn: ((props: SuggestionItem) => void) | null = null;

    function selectItem(index: number) {
      const item = items[index];
      if (item && commandFn) {
        commandFn(item);
      }
    }

    function positionPopup(clientRect: (() => DOMRect | null) | null) {
      if (!popup || !clientRect) return;
      const rect = clientRect();
      if (!rect) return;

      const popupHeight = popup.offsetHeight || 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const above = spaceBelow < popupHeight && rect.top > popupHeight;

      popup.style.left = `${Math.min(rect.left, window.innerWidth - 270)}px`;
      popup.style.top = above
        ? `${rect.top - popupHeight}px`
        : `${rect.bottom + 4}px`;
    }

    return {
      onStart(props: SuggestionProps<SuggestionItem>) {
        popup = document.createElement("div");
        popup.className = "note-link-suggest";
        document.body.appendChild(popup);

        commandFn = props.command as typeof commandFn;
        items = props.items as SuggestionItem[];
        selectedIndex = 0;
        buildList();
        positionPopup(props.clientRect ?? null);
      },

      onUpdate(props: SuggestionProps<SuggestionItem>) {
        commandFn = props.command as typeof commandFn;
        items = props.items as SuggestionItem[];
        selectedIndex = 0;
        buildList();
        positionPopup(props.clientRect ?? null);
      },

      onKeyDown(props: { event: KeyboardEvent }) {
        if (props.event.key === "ArrowDown") {
          selectedIndex = (selectedIndex + 1) % Math.max(items.length, 1);
          buildList();
          return true;
        }
        if (props.event.key === "ArrowUp") {
          selectedIndex =
            (selectedIndex - 1 + items.length) % Math.max(items.length, 1);
          buildList();
          return true;
        }
        if (props.event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        if (props.event.key === "Escape") {
          return true;
        }
        return false;
      },

      onExit() {
        if (popup) {
          popup.remove();
          popup = null;
        }
        commandFn = null;
      },
    };
  },
};
