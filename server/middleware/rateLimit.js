'use strict';
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const make = ({ windowMs = 15 * 60 * 1000, limit, byEmail = false, skipSuccessfulRequests = false, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: () => env.rateLimitDisabled,
    keyGenerator: (req) => (byEmail ? `${req.ip}|${String(req.body?.email ?? '').toLowerCase().slice(0, 254)}` : req.ip),
    handler: (_req, _res, next) => next(new AppError(429, 'RATE_LIMITED', message || 'Too many attempts. Please wait a few minutes and try again.')),
  });

module.exports = {
  apiLimiter: make({ limit: 300 }),
  loginLimiter: make({ limit: 10, byEmail: true, skipSuccessfulRequests: true }),
  adminLoginLimiter: make({ limit: 5, byEmail: true, skipSuccessfulRequests: true }),
  otpSendLimiter: make({ limit: 5, byEmail: true }),
  otpVerifyLimiter: make({ limit: 10, byEmail: true }),
  resetLimiter: make({ limit: 10 }),
  googleLimiter: make({ limit: 20 }),
  refreshLimiter: make({ limit: 60 }),
  searchLimiter: make({ limit: 30 }),
  adminReadLimiter: make({ limit: 240 }),
};
