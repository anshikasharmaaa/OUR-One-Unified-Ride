import { http } from "./http";

export const contactService = {
  send: (body) => http.post("/contact", body).then((r) => r.data),
};
