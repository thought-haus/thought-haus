import MiniSearch from "minisearch";
import { signal } from "@preact/signals";

export interface SearchDocument {
  id: string;
  title: string;
  tags: string;
  body: string;
}

export interface SearchResult {
  id: string;
  title: string;
  score: number;
}

const MINISEARCH_OPTIONS = {
  fields: ["title", "tags", "body"],
  storeFields: ["title"],
  searchOptions: {
    boost: { title: 2, tags: 1.5 },
    fuzzy: 0.2,
    prefix: true,
  },
};

let miniSearch = new MiniSearch<SearchDocument>(MINISEARCH_OPTIONS);

/** Current search query. */
export const searchQuery = signal("");

/** Current search results. */
export const searchResults = signal<SearchResult[]>([]);

/** Whether search is active (query is non-empty). */
export const isSearchActive = signal(false);

/** Build the search index from all notes. Requires reading file content. */
export function buildIndex(
  docs: { id: string; title: string; tags: string[]; body: string }[],
): void {
  miniSearch = new MiniSearch<SearchDocument>(MINISEARCH_OPTIONS);
  for (const doc of docs) {
    miniSearch.add({
      id: doc.id,
      title: doc.title,
      tags: doc.tags.join(" "),
      body: doc.body,
    });
  }
}

/** Add a single document to the index. */
export function addToIndex(doc: {
  id: string;
  title: string;
  tags: string[];
  body: string;
}): void {
  miniSearch.add({
    id: doc.id,
    title: doc.title,
    tags: doc.tags.join(" "),
    body: doc.body,
  });
}

/** Update a document in the index (remove old, add new). */
export function updateInIndex(doc: {
  id: string;
  title: string;
  tags: string[];
  body: string;
}): void {
  try {
    miniSearch.discard(doc.id);
  } catch {
    // Document might not exist yet
  }
  addToIndex(doc);
}

/** Remove a document from the index. */
export function removeFromIndex(id: string): void {
  try {
    miniSearch.discard(id);
  } catch {
    // Document might not exist
  }
}

/** Execute a search query and update results signal. */
export function executeSearch(query: string): SearchResult[] {
  searchQuery.value = query;

  if (!query.trim()) {
    searchResults.value = [];
    isSearchActive.value = false;
    return [];
  }

  isSearchActive.value = true;
  const results = miniSearch.search(query).map((r) => ({
    id: r.id as string,
    title: (r.title as string) || "",
    score: r.score,
  }));
  searchResults.value = results;
  return results;
}

/** Clear the search state. */
export function clearSearch(): void {
  searchQuery.value = "";
  searchResults.value = [];
  isSearchActive.value = false;
}

/** Query the index without mutating UI signals. Used by the agent tools. */
export function queryIndex(query: string): SearchResult[] {
  if (!query.trim()) return [];
  return miniSearch.search(query).map((r) => ({
    id: r.id as string,
    title: (r.title as string) || "",
    score: r.score,
  }));
}

/** Serialize the index to JSON for IndexedDB persistence. */
export function serializeIndex(): string {
  return JSON.stringify(miniSearch);
}

/** Load a previously serialized index, replacing the current one. */
export function loadSerializedIndex(json: string): void {
  miniSearch = MiniSearch.loadJSON<SearchDocument>(json, MINISEARCH_OPTIONS);
}
