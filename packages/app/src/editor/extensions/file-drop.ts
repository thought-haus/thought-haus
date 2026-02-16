import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface FileDropOptions {
  onFileDrop: (files: File[], pos: number) => void;
}

const fileDropKey = new PluginKey("fileDrop");

/**
 * TipTap extension that handles file paste and drag-drop.
 * Delegates to `onFileDrop` callback for actual attachment handling.
 */
export const FileDrop = Extension.create<FileDropOptions>({
  name: "fileDrop",

  addOptions() {
    return {
      onFileDrop: () => {},
    };
  },

  addProseMirrorPlugins() {
    const { onFileDrop } = this.options;

    return [
      new Plugin({
        key: fileDropKey,
        props: {
          handlePaste(_view, event) {
            const files = Array.from(event.clipboardData?.files ?? []);
            if (files.length === 0) return false;
            event.preventDefault();
            const { from } = _view.state.selection;
            onFileDrop(files, from);
            return true;
          },
          handleDrop(view, event) {
            const files = Array.from(
              (event as DragEvent).dataTransfer?.files ?? [],
            );
            if (files.length === 0) return false;
            event.preventDefault();
            const coords = { left: (event as DragEvent).clientX, top: (event as DragEvent).clientY };
            const pos = view.posAtCoords(coords)?.pos ?? view.state.selection.from;
            onFileDrop(files, pos);
            return true;
          },
        },
      }),
    ];
  },
});
