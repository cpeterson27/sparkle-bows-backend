const SESSION_STORAGE_KEY = "sparklebows.session.active";

export function markSessionActive() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, "1");
  } catch {}
}

export function clearSessionMarker() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
}

export function hasSessionMarker() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
