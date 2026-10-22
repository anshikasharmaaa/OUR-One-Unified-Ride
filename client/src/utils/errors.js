/** Turn any axios error into a message a person can act on. */
export function apiErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.';
  if (err?.request || err?.message === 'Network Error') return "Can't reach the server. Check your connection and try again.";
  return fallback;
}
export const apiErrorCode = (err) => err?.response?.data?.code;

/** Push server-side field errors into react-hook-form. Returns true if any were applied. */
export function applyFieldErrors(err, setError, allowed) {
  const list = err?.response?.data?.errors;
  if (!Array.isArray(list)) return false;
  let applied = false;
  list.forEach((e) => {
    if (e?.field && allowed.includes(e.field)) {
      setError(e.field, { type: 'server', message: e.message });
      applied = true;
    }
  });
  return applied;
}
