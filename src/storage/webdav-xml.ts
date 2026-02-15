export interface PropfindEntry {
  href: string;
  lastModified: number;
  size: number;
  isCollection: boolean;
}

/** Parse a WebDAV multistatus PROPFIND response into entries. */
export function parsePropfindResponse(
  xmlText: string,
  baseUrl: string,
): PropfindEntry[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error("Malformed XML in PROPFIND response");
  }

  const responses = doc.getElementsByTagNameNS("DAV:", "response");
  const entries: PropfindEntry[] = [];

  for (let i = 0; i < responses.length; i++) {
    const resp = responses[i];

    const hrefEl = resp.getElementsByTagNameNS("DAV:", "href")[0];
    if (!hrefEl?.textContent) continue;

    const rawHref = decodeURIComponent(hrefEl.textContent);

    const resourceType = resp.getElementsByTagNameNS("DAV:", "resourcetype")[0];
    const isCollection = resourceType
      ? resourceType.getElementsByTagNameNS("DAV:", "collection").length > 0
      : false;

    const lastModEl = resp.getElementsByTagNameNS("DAV:", "getlastmodified")[0];
    const lastModified = lastModEl?.textContent
      ? new Date(lastModEl.textContent).getTime()
      : 0;

    const sizeEl = resp.getElementsByTagNameNS("DAV:", "getcontentlength")[0];
    const size = sizeEl?.textContent ? parseInt(sizeEl.textContent, 10) : 0;

    entries.push({ href: rawHref, lastModified, size, isCollection });
  }

  // Filter out the base collection itself (the first response is usually the queried resource)
  const normalizedBase = normalizeHref(baseUrl);
  return entries.filter((e) => normalizeHref(e.href) !== normalizedBase);
}

/** Extract just the filename from a full href path. */
export function hrefToFilename(href: string): string {
  const cleaned = href.endsWith("/") ? href.slice(0, -1) : href;
  const lastSlash = cleaned.lastIndexOf("/");
  return lastSlash === -1 ? cleaned : cleaned.slice(lastSlash + 1);
}

function normalizeHref(href: string): string {
  try {
    const url = new URL(href);
    return url.pathname.replace(/\/+$/, "");
  } catch {
    return href.replace(/\/+$/, "");
  }
}
