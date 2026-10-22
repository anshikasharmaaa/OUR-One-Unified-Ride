// Remembers which address is mid-verification so a page refresh doesn't strand the person.
// Stores only the email and the time the code was sent — never a code or a token.
const KEY = 'our.pending';
export const getPending = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch { return null; }
};
export const setPending = (p) => {
  try { sessionStorage.setItem(KEY, JSON.stringify(p)); } catch { /* storage unavailable: fall back to router state */ }
};
export const clearPending = () => {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
};
