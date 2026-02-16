import browser from "webextension-polyfill";

export { browser };

/** Check if the File System Access API is available (Chromium only). */
export function hasFileSystemAccess(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}
