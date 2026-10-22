import { http } from "./http";

const data = (p) => p.then((r) => r.data.data);
const body = (p) => p.then((r) => r.data);

export const accountService = {
  profile: () => data(http.get("/me")),
  updateProfile: (payload) => data(http.patch("/me", payload)),
  changePassword: (payload) => body(http.post("/me/password", payload)),
  deleteAccount: (payload) => body(http.delete("/me", { data: payload })),

  // Profile photo. The image needs the auth header, so it is fetched as a blob instead of used as an <img src>.
  avatar: () =>
    http.get("/me/avatar", { responseType: "blob" }).then((r) => r.data),
  uploadAvatar: (blob) =>
    data(
      http.post("/me/avatar", blob, { headers: { "Content-Type": blob.type } }),
    ),
  removeAvatar: () => data(http.delete("/me/avatar")),

  rides: (page = 1, limit = 10, type) =>
    data(http.get("/me/rides", { params: { page, limit, type } })),

  favorites: () => data(http.get("/me/favorites")),
  addFavorite: (payload) => data(http.post("/me/favorites", payload)),
  updateFavorite: (id, payload) =>
    data(http.patch(`/me/favorites/${id}`, payload)),
  removeFavorite: (id) => data(http.delete(`/me/favorites/${id}`)),

  notifications: (page = 1, limit = 10, unread) =>
    data(http.get("/me/notifications", { params: { page, limit, unread } })),
  unreadCount: () => data(http.get("/me/notifications/unread-count")),
  markRead: (id) => data(http.post(`/me/notifications/${id}/read`)),
  markAllRead: () => data(http.post("/me/notifications/read-all")),

  referral: () => data(http.get("/me/referral")),
  applyReferral: (code) => data(http.post("/me/referral/apply", { code })),
};
