async function getServerCookieHeader(): Promise<string | undefined> {
  if (typeof window !== "undefined") return undefined;

  const { cookies } = await import("next/headers");
  const store = await cookies();
  const all = store.getAll();
  if (all.length === 0) return undefined;

  return all.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

/** Browser + RSC fetch with session cookies forwarded on the server. */
export async function fetchApi(
  input: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  const cookieHeader = await getServerCookieHeader();
  if (cookieHeader && !headers.has("Cookie")) {
    headers.set("Cookie", cookieHeader);
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
    cache: init.cache ?? "no-store",
  });
}
