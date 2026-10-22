'use strict';
const env = require('../config/env');
const AppError = require('../utils/AppError');

// CSRF defence for the two cookie-authenticated endpoints (refresh, logout):
// the request must come from our frontend origin AND carry a custom header (which forces a CORS preflight).
module.exports = (req, _res, next) => {
  if (req.get('origin') !== env.clientOrigin || req.get('x-requested-with') !== 'OUR') {
    return next(new AppError(403, 'CSRF_REJECTED', 'Request blocked.'));
  }
  return next();
};
