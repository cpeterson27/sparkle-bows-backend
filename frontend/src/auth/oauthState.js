const OAUTH_STORAGE_KEY = "sparklebows.oauth.result";

function parseSearch(search = "") {
  return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

export function hasOAuthParams(search = "") {
  const params = parseSearch(search);

  return (
    params.has("oauth") ||
    params.has("oauth_error") ||
    params.has("error") ||
    params.has("token") ||
    params.has("accessToken")
  );
}

export function storeOAuthResult(search = "") {
  if (typeof window === "undefined" || !hasOAuthParams(search)) return false;

  try {
    window.sessionStorage.setItem(OAUTH_STORAGE_KEY, search);
    return true;
  } catch {
    return false;
  }
}

export function consumeStoredOAuthResult() {
  if (typeof window === "undefined") return "";

  try {
    const stored = window.sessionStorage.getItem(OAUTH_STORAGE_KEY) || "";
    if (stored) {
      window.sessionStorage.removeItem(OAUTH_STORAGE_KEY);
    }
    return stored;
  } catch {
    return "";
  }
}
