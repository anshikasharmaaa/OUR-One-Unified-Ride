'use strict';
const send = (res, status, message, data = {}) =>
  res.status(status).json({ success: true, message, data });
module.exports = { ok: (res, m, d) => send(res, 200, m, d), created: (res, m, d) => send(res, 201, m, d) };
