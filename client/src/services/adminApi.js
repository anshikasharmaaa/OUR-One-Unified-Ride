import { http } from "./http";

const get = (url, params) => http.get(url, { params }).then((r) => r.data.data);
const send = (method, url, data) =>
  http({ method, url, data }).then((r) => r.data.data);

export const adminApi = {
  overview: (days = 14) => get("/admin/overview", { days }),
  stats: () => get("/admin/stats"),
  users: (page = 1, limit = 10, verified, q) =>
    get("/admin/users", { page, limit, verified, q }),
  userDetail: (id) => get(`/admin/users/${id}`),
  userRides: (id, page = 1, limit = 10, type) =>
    get(`/admin/users/${id}/rides`, { page, limit, type }),
  searches: (page = 1, limit = 10) => get("/admin/searches", { page, limit }),
  analytics: (days = 14) => get("/admin/analytics", { days }),
  health: () => get("/health"),

  contacts: (params) => get("/admin/contacts", params),
  contactCounts: () => get("/admin/contacts/counts"),
  contact: (id) => get(`/admin/contacts/${id}`),
  setContactStatus: (id, status) =>
    send("patch", `/admin/contacts/${id}/status`, { status }),
  replyContact: (id, body) => send("post", `/admin/contacts/${id}/reply`, body),

  providers: () => get("/admin/providers"),
  createProvider: (body) => send("post", "/admin/providers", body),
  updateProvider: (id, body) => send("patch", `/admin/providers/${id}`, body),
  deleteProvider: (id) => send("delete", `/admin/providers/${id}`),
};
