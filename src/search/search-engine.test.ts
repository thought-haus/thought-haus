import { describe, it, expect, beforeEach } from "vitest";
import {
  buildIndex,
  addToIndex,
  updateInIndex,
  removeFromIndex,
  executeSearch,
  clearSearch,
  searchQuery,
  searchResults,
  isSearchActive,
  serializeIndex,
  loadSerializedIndex,
} from "./search-engine.ts";

describe("search-engine", () => {
  beforeEach(() => {
    // Reset index with empty data
    buildIndex([]);
    clearSearch();
  });

  describe("buildIndex", () => {
    it("builds index from documents", () => {
      buildIndex([
        { id: "1", title: "Meeting Notes", tags: ["work"], body: "Discussed roadmap" },
        { id: "2", title: "Recipe Ideas", tags: ["cooking"], body: "Pasta with sauce" },
      ]);

      const results = executeSearch("meeting");
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("1");
    });

    it("replaces existing index", () => {
      buildIndex([
        { id: "1", title: "First", tags: [], body: "content" },
      ]);
      buildIndex([
        { id: "2", title: "Second", tags: [], body: "content" },
      ]);

      expect(executeSearch("first").length).toBe(0);
      expect(executeSearch("second").length).toBe(1);
    });
  });

  describe("addToIndex", () => {
    it("adds a document that becomes searchable", () => {
      addToIndex({ id: "1", title: "New Note", tags: ["test"], body: "Hello world" });
      expect(executeSearch("hello").length).toBe(1);
    });
  });

  describe("updateInIndex", () => {
    it("updates an existing document", () => {
      buildIndex([
        { id: "1", title: "Original Title", tags: [], body: "Original body" },
      ]);

      updateInIndex({ id: "1", title: "Updated Title", tags: [], body: "Updated body" });

      expect(executeSearch("original").length).toBe(0);
      expect(executeSearch("updated").length).toBe(1);
    });

    it("handles updating a non-existent document", () => {
      updateInIndex({ id: "new", title: "Brand New", tags: [], body: "Fresh content" });
      expect(executeSearch("brand").length).toBe(1);
    });
  });

  describe("removeFromIndex", () => {
    it("removes a document from search results", () => {
      buildIndex([
        { id: "1", title: "To Remove", tags: [], body: "Gone soon" },
        { id: "2", title: "To Keep", tags: [], body: "Stays here" },
      ]);

      removeFromIndex("1");
      expect(executeSearch("remove").length).toBe(0);
      expect(executeSearch("keep").length).toBe(1);
    });

    it("handles removing a non-existent document", () => {
      expect(() => removeFromIndex("nonexistent")).not.toThrow();
    });
  });

  describe("executeSearch", () => {
    beforeEach(() => {
      buildIndex([
        { id: "1", title: "Meeting Notes", tags: ["work", "project"], body: "Discussed the roadmap and milestones" },
        { id: "2", title: "Recipe Ideas", tags: ["cooking", "personal"], body: "Pasta with tomato sauce" },
        { id: "3", title: "Work Log", tags: ["work"], body: "Completed sprint review" },
      ]);
    });

    it("searches across titles", () => {
      const results = executeSearch("meeting");
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("1");
    });

    it("searches across body content", () => {
      const results = executeSearch("pasta");
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("2");
    });

    it("searches across tags", () => {
      const results = executeSearch("cooking");
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("2");
    });

    it("boosts title matches over body matches", () => {
      buildIndex([]);
      addToIndex({ id: "title-match", title: "Important work notes", tags: [], body: "random content" });
      addToIndex({ id: "body-match", title: "Random title", tags: [], body: "important work notes" });

      const results = executeSearch("important work notes");
      expect(results.length).toBe(2);
      expect(results[0].id).toBe("title-match");
    });

    it("supports fuzzy matching", () => {
      const results = executeSearch("meetting"); // typo
      expect(results.length).toBeGreaterThan(0);
    });

    it("supports prefix search", () => {
      const results = executeSearch("meet");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe("1");
    });

    it("returns empty array for empty query", () => {
      const results = executeSearch("");
      expect(results).toEqual([]);
    });

    it("returns empty array for whitespace-only query", () => {
      const results = executeSearch("   ");
      expect(results).toEqual([]);
    });

    it("returns ranked results with scores", () => {
      const results = executeSearch("work");
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(result.score).toBeGreaterThan(0);
        expect(result.id).toBeTruthy();
      }
    });

    it("updates signal state when searching", () => {
      executeSearch("meeting");
      expect(searchQuery.value).toBe("meeting");
      expect(isSearchActive.value).toBe(true);
      expect(searchResults.value.length).toBeGreaterThan(0);
    });

    it("deactivates search on empty query", () => {
      executeSearch("meeting");
      expect(isSearchActive.value).toBe(true);

      executeSearch("");
      expect(isSearchActive.value).toBe(false);
      expect(searchResults.value).toEqual([]);
    });
  });

  describe("clearSearch", () => {
    it("resets all search state", () => {
      buildIndex([
        { id: "1", title: "Test", tags: [], body: "Content" },
      ]);
      executeSearch("test");

      clearSearch();
      expect(searchQuery.value).toBe("");
      expect(searchResults.value).toEqual([]);
      expect(isSearchActive.value).toBe(false);
    });
  });

  describe("serialization", () => {
    it("serializes and loads index", () => {
      buildIndex([
        { id: "1", title: "Persistent Note", tags: ["saved"], body: "This should survive" },
      ]);

      const json = serializeIndex();
      expect(json).toBeTruthy();
      expect(typeof json).toBe("string");

      // Wipe and reload
      buildIndex([]);
      expect(executeSearch("persistent").length).toBe(0);

      loadSerializedIndex(json);
      const results = executeSearch("persistent");
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("1");
    });
  });
});
