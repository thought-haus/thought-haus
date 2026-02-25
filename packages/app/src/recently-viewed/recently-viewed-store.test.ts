import { beforeEach, describe, expect, it } from "vitest";
import { notesMap } from "../notes/note-store.ts";
import { selectedNoteId } from "../lib/app-state.ts";
import {
  recentlyViewedIds,
  recentlyViewedNotes,
  initRecentlyViewed,
  trackRecentlyViewed,
  startRecentlyViewedTracking,
} from "./recently-viewed-store.ts";
import type { Note } from "@thought-haus/core";

function makeNote(id: string, title: string): Note {
  return {
    id,
    title,
    tags: [],
    properties: {},
    filename: `${id}.md`,
    lastModified: Date.now(),
    size: 100,
    isTimestampFormat: true,
    createdAt: new Date(),
  };
}

describe("recently-viewed-store", () => {
  beforeEach(() => {
    localStorage.clear();
    recentlyViewedIds.value = [];
    notesMap.value = new Map();
    selectedNoteId.value = null;
  });

  it("tracks notes in most-recent-first order with a max of five", () => {
    trackRecentlyViewed("1");
    trackRecentlyViewed("2");
    trackRecentlyViewed("3");
    trackRecentlyViewed("4");
    trackRecentlyViewed("5");
    trackRecentlyViewed("6");

    expect(recentlyViewedIds.value).toEqual(["6", "5", "4", "3", "2"]);
  });

  it("moves an existing note to the front when viewed again", () => {
    trackRecentlyViewed("1");
    trackRecentlyViewed("2");
    trackRecentlyViewed("1");

    expect(recentlyViewedIds.value).toEqual(["1", "2"]);
  });

  it("initializes from localStorage", () => {
    localStorage.setItem("th-recently-viewed-note-ids", JSON.stringify(["3", "2", "1"]));

    initRecentlyViewed();

    expect(recentlyViewedIds.value).toEqual(["3", "2", "1"]);
  });

  it("resolves IDs to existing notes only", () => {
    notesMap.value = new Map([
      ["1", makeNote("1", "One")],
      ["2", makeNote("2", "Two")],
    ]);
    recentlyViewedIds.value = ["2", "3", "1"];

    expect(recentlyViewedNotes.value.map((note) => note.id)).toEqual(["2", "1"]);
  });

  it("tracks selected note changes", () => {
    startRecentlyViewedTracking();

    selectedNoteId.value = "note-1";
    selectedNoteId.value = "note-2";

    expect(recentlyViewedIds.value).toEqual(["note-2", "note-1"]);
  });
});
