import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { notesSorted } from "../../notes/note-store.ts";
import type { Note } from "@thought-haus/core";

export const noteLinkSuggestion: Omit<SuggestionOptions<Note>, "editor"> = {
  char: "[[",

  items({ query }) {
    const q = query.toLowerCase();
    return notesSorted.value
      .filter((n) => n.title.toLowerCase().includes(q))
      .slice(0, 50);
  },

  command({ editor, range, props: note }) {
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent({ type: "noteLink", attrs: { noteId: note.id } })
      .run();
  },

  render() {
    let popup: HTMLDivElement | null = null;
    let selectedIndex = 0;
    let items: Note[] = [];

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

      items.forEach((note, index) => {
        const btn = document.createElement("button");
        btn.className = "note-link-suggest-item";
        if (index === selectedIndex) btn.classList.add("is-selected");
        btn.textContent = note.title;
        btn.addEventListener("mousedown", (e) => {
          e.preventDefault();
        });
        btn.addEventListener("click", () => {
          selectItem(index);
        });
        popup!.appendChild(btn);
      });

      const selected = popup.querySelector(".is-selected");
      if (selected) selected.scrollIntoView({ block: "nearest" });
    }

    let commandFn: ((props: { id: string } & Note) => void) | null = null;

    function selectItem(index: number) {
      const note = items[index];
      if (note && commandFn) {
        commandFn(note as { id: string } & Note);
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
      onStart(props: SuggestionProps<Note>) {
        popup = document.createElement("div");
        popup.className = "note-link-suggest";
        document.body.appendChild(popup);

        commandFn = props.command as typeof commandFn;
        items = props.items as Note[];
        selectedIndex = 0;
        buildList();
        positionPopup(props.clientRect ?? null);
      },

      onUpdate(props: SuggestionProps<Note>) {
        commandFn = props.command as typeof commandFn;
        items = props.items as Note[];
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
