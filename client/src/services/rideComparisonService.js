import { http as api } from "./http";

const unwrap = (res) => res.data.data; // server envelope: { success, message, data }

export const rideComparisonService = {
  compare: (comparisonId, { signal } = {}) =>
    api
      .get("/rides/compare", { params: { comparisonId }, signal })
      .then(unwrap),
  providers: () => api.get("/rides/providers").then(unwrap),
};

export const rideBookingService = {
  create: (payload) => api.post("/rides/book", payload).then(unwrap),
  get: (id, { signal } = {}) =>
    api.get(`/rides/bookings/${id}`, { signal }).then(unwrap),
  cancel: (id) => api.post(`/rides/bookings/${id}/cancel`).then(unwrap),
  providerOpened: (id) =>
    api.post(`/rides/bookings/${id}/provider-opened`).then(unwrap),
};
