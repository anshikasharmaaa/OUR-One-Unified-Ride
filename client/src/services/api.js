const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not configured");
}

export async function apiRequest(path, options = {}) {
  const url = `${API_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
  });
}
