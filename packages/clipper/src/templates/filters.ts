import { slugify } from "@thought-haus/core";

export type FilterFn = (value: string, arg?: string) => string;

const filters: Record<string, FilterFn> = {
  slug: (value) => slugify(value),

  blockquote: (value) =>
    value
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n"),

  trim: (value) => value.trim(),

  uppercase: (value) => value.toUpperCase(),

  lowercase: (value) => value.toLowerCase(),

  truncate: (value, arg) => {
    const n = parseInt(arg ?? "100", 10);
    if (isNaN(n) || n <= 0) return value;
    return value.length > n ? value.slice(0, n) + "..." : value;
  },

  default: (value, arg) => value || arg || "",

  date: (value, arg) => {
    if (!value) return "";
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      if (!arg) return d.toISOString().split("T")[0];
      // Simple date format: YYYY-MM-DD, YYYY/MM/DD
      return arg
        .replace("YYYY", String(d.getFullYear()))
        .replace("MM", String(d.getMonth() + 1).padStart(2, "0"))
        .replace("DD", String(d.getDate()).padStart(2, "0"));
    } catch {
      return value;
    }
  },
};

/** Apply a named filter with optional argument to a value. */
export function applyFilter(name: string, value: string, arg?: string): string {
  const fn = filters[name];
  if (!fn) return value;
  return fn(value, arg);
}

/** Parse a filter chain like "slug" or "truncate:50" or "date:YYYY-MM-DD". */
export function parseFilterChain(chain: string): Array<{ name: string; arg?: string }> {
  return chain.split("|").map((part) => {
    const trimmed = part.trim();
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) return { name: trimmed };
    return {
      name: trimmed.slice(0, colonIdx),
      arg: trimmed.slice(colonIdx + 1).replace(/^["']|["']$/g, ""),
    };
  });
}
