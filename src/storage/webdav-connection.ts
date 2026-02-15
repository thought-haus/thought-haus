export type ConnectionResult =
  | { ok: true }
  | { ok: false; error: "cors" | "auth" | "not_found" | string };

/** Test a WebDAV connection by sending a PROPFIND to the base URL. */
export async function testWebDavConnection(
  url: string,
  username: string,
  password: string,
): Promise<ConnectionResult> {
  const baseUrl = url.endsWith("/") ? url : url + "/";
  const authHeader = "Basic " + btoa(username + ":" + password);

  try {
    const response = await fetch(baseUrl, {
      method: "PROPFIND",
      headers: {
        Authorization: authHeader,
        Depth: "0",
        "Content-Type": "application/xml",
      },
      body: '<?xml version="1.0" encoding="utf-8"?><propfind xmlns="DAV:"><prop><resourcetype/></prop></propfind>',
    });

    if (response.ok || response.status === 207) {
      return { ok: true };
    }

    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "auth" };
    }

    if (response.status === 404) {
      return { ok: false, error: "not_found" };
    }

    return { ok: false, error: `Server returned ${response.status} ${response.statusText}` };
  } catch (err) {
    if (err instanceof TypeError) {
      return { ok: false, error: "cors" };
    }
    return { ok: false, error: String(err) };
  }
}
