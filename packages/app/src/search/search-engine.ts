import MiniSearch from "minisearch";
import { signal } from "@preact/signals";

export interface SearchDocument {
  id: string;
  title: string;
  tags: string;
  body: string;
  lastModified: number;
}

export interface SearchResult {
  id: string;
  title: string;
  score: number;
}

// Synthetic tokens injected into the index for structural markdown patterns
// that MiniSearch's default tokenizer would otherwise discard.
const TASK_UNDONE_TOKEN = "__th.task.undone__";
const TASK_DONE_TOKEN = "__th.task.done__";

const SYNTHETIC_TOKEN_RE = /__th\.[a-z.]+__/g;
const DEFAULT_SPLIT_RE = /[\n\r\p{Z}\p{P}]+/u;

/** Tokenizer that preserves __th.*__ synthetic tokens as single terms. */
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(new RegExp(SYNTHETIC_TOKEN_RE, "g"))) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      for (const t of before.split(DEFAULT_SPLIT_RE)) {
        if (t) tokens.push(t);
      }
    }
    tokens.push(match[0]);
    lastIndex = match.index! + match[0].length;
  }

  const tail = text.slice(lastIndex);
  if (tail) {
    for (const t of tail.split(DEFAULT_SPLIT_RE)) {
      if (t) tokens.push(t);
    }
  }

  return tokens;
}

/** Disable fuzzy/prefix for synthetic tokens to prevent cross-matching. */
function fuzzy(term: string): number | false {
  return SYNTHETIC_TOKEN_RE.test(term) ? false : 0.2;
}
function prefix(term: string): boolean {
  return !SYNTHETIC_TOKEN_RE.test(term);
}

const MINISEARCH_OPTIONS = {
  fields: ["title", "tags", "body"],
  storeFields: ["title", "lastModified"],
  tokenize,
  searchOptions: {
    boost: { title: 2, tags: 1.5 },
    fuzzy,
    prefix,
    tokenize,
  },
};

let miniSearch = new MiniSearch<SearchDocument>(MINISEARCH_OPTIONS);

// Patterns that map markdown task syntax → synthetic tokens
const TASK_UNDONE_RE = /- \[ \]/g;
const TASK_DONE_RE = /- \[x\]/gi;

/** Inject synthetic tokens for structural markdown patterns. */
export function preprocessBody(body: string): string {
  const extras: string[] = [];
  if (TASK_UNDONE_RE.test(body)) extras.push(TASK_UNDONE_TOKEN);
  if (TASK_DONE_RE.test(body)) extras.push(TASK_DONE_TOKEN);
  // Reset lastIndex since we used global regexes with .test()
  TASK_UNDONE_RE.lastIndex = 0;
  TASK_DONE_RE.lastIndex = 0;
  if (extras.length === 0) return body;
  return body + " " + extras.join(" ");
}

/** Translate user query task-marker patterns to synthetic tokens. */
export function preprocessQuery(query: string): string {
  return query
    .replace(TASK_DONE_RE, TASK_DONE_TOKEN)
    .replace(TASK_UNDONE_RE, TASK_UNDONE_TOKEN);
}

/** Current search query. */
export const searchQuery = signal("");

/** Current search results. */
export const searchResults = signal<SearchResult[]>([]);

/** Whether search is active (query is non-empty). */
export const isSearchActive = signal(false);

/** Build the search index from all notes. Requires reading file content. */
export function buildIndex(
  docs: { id: string; title: string; tags: string[]; body: string; lastModified: number }[],
): void {
  miniSearch = new MiniSearch<SearchDocument>(MINISEARCH_OPTIONS);
  for (const doc of docs) {
    miniSearch.add({
      id: doc.id,
      title: doc.title,
      tags: doc.tags.join(" "),
      body: preprocessBody(doc.body),
      lastModified: doc.lastModified,
    });
  }
}

/** Add a single document to the index. */
export function addToIndex(doc: {
  id: string;
  title: string;
  tags: string[];
  body: string;
  lastModified: number;
}): void {
  miniSearch.add({
    id: doc.id,
    title: doc.title,
    tags: doc.tags.join(" "),
    body: preprocessBody(doc.body),
    lastModified: doc.lastModified,
  });
}

/** Update a document in the index (remove old, add new). */
export function updateInIndex(doc: {
  id: string;
  title: string;
  tags: string[];
  body: string;
  lastModified: number;
}): void {
  try {
    miniSearch.discard(doc.id);
  } catch {
    // Document might not exist yet
  }
  addToIndex(doc);
}

/** Extract document metadata from the serialized index for incremental diffing. */
export function getIndexedDocumentMeta(): { id: string; lastModified: number }[] {
  // MiniSearch stores stored fields accessible via search with empty query trick,
  // but we need raw access. Use the internal _storedFields map.
  const stored = (miniSearch as unknown as { _storedFields: Map<number, Record<string, unknown>> })._storedFields;
  const idMap = (miniSearch as unknown as { _documentIds: Map<number, string> })._documentIds;
  if (!stored || !idMap) return [];

  const result: { id: string; lastModified: number }[] = [];
  for (const [internalId, fields] of stored) {
    const docId = idMap.get(internalId);
    if (docId) {
      result.push({
        id: docId,
        lastModified: (fields.lastModified as number) ?? 0,
      });
    }
  }
  return result;
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
  const results = miniSearch.search(preprocessQuery(query)).map((r) => ({
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
  return miniSearch.search(preprocessQuery(query)).map((r) => ({
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
