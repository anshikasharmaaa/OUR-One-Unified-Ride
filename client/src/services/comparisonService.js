import { http as api } from "./http";

const unwrap = (res) => res.data.data; // server envelope: { success, message, data }

export const comparisonService = {
  create: (payload) => api.post("/comparisons", payload).then(unwrap),
  get: (id) => api.get(`/comparisons/${id}`).then(unwrap),
  list: (params) => api.get("/comparisons", { params }).then(unwrap),
};

export const mapsService = {
  reverseGeocode: (lat, lng) =>
    api.post("/maps/reverse-geocode", { lat, lng }).then(unwrap),
};
