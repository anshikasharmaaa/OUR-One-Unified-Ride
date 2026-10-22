const KEY = "our:compare-draft";

// sessionStorage: survives the login redirect in the same tab, disappears when the tab closes.
export function saveDraft(draft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* storage blocked: draft just won't persist */
  }
}
export function loadDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
