import { http } from './http';

export const searchService = {
  // Records that a search was submitted. The API does not return fares because none exist yet.
  create: (body) => http.post('/searches', body).then((r) => r.data),
  // The signed-in rider's own history.
  mine: (page = 1, limit = 10) => http.get('/searches/mine', { params: { page, limit } }).then((r) => r.data.data),
};
