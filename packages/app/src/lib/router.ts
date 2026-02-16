import { effect } from "@preact/signals";
import { selectedNoteId } from "./app-state.ts";
import { getNote } from "../notes/note-store.ts";

let dispose: (() => void) | null = null;
let isSyncing = false;
let pendingHash: string | null = null;
let pendingApplied = false;

export function readHash(): string | null {
  const hash = window.location.hash.slice(1);
  return hash || null;
}

function onHashChange(): void {
  if (isSyncing) return;
  const id = readHash();
  isSyncing = true;
  if (id && getNote(id)) {
    selectedNoteId.value = id;
  } else {
    selectedNoteId.value = null;
    if (id) {
      history.replaceState(null, "", window.location.pathname);
    }
  }
  queueMicrotask(() => {
    isSyncing = false;
  });
}

export function startRouter(): void {
  pendingHash = readHash();
  pendingApplied = false;

  dispose = effect(() => {
    const id = selectedNoteId.value;
    if (isSyncing) return;
    isSyncing = true;
    if (id) {
      history.pushState(null, "", `#${id}`);
    } else {
      history.replaceState(null, "", window.location.pathname);
    }
    queueMicrotask(() => {
      isSyncing = false;
    });
  });

  window.addEventListener("popstate", onHashChange);
  window.addEventListener("hashchange", onHashChange);
}

export function applyPendingHash(): void {
  if (pendingApplied || !pendingHash) return;
  pendingApplied = true;
  const id = pendingHash;
  if (getNote(id)) {
    selectedNoteId.value = id;
  } else {
    history.replaceState(null, "", window.location.pathname);
  }
}

export function stopRouter(): void {
  dispose?.();
  dispose = null;
  window.removeEventListener("popstate", onHashChange);
  window.removeEventListener("hashchange", onHashChange);
  pendingHash = null;
  pendingApplied = false;
  isSyncing = false;
}
