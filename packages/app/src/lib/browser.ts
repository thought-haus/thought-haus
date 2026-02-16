/** Detects if the current browser supports the File System Access API. */
export function isFileSystemAccessSupported(): boolean {
  return typeof window.showDirectoryPicker === "function";
}
