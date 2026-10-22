"use strict";
const rateLimit = require("express-rate-limit");
const env = require("../config/env");
const AppError = require("../utils/AppError");

const make = (opts, message) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.rateLimitDisabled,
    handler: (_req, _res, next) =>
      next(new AppError(429, "RATE_LIMITED", message)),
    ...opts,
  });

// Public form: a handful of messages per visitor per 15 minutes.
exports.contactLimiter = make(
  { windowMs: 15 * 60 * 1000, limit: 5 },
  "You have sent several messages recently. Please try again in a few minutes.",
);
// Admin email replies: per administrator, so a stuck client cannot hammer the SMTP account.
exports.replyLimiter = make(
  {
    windowMs: 10 * 60 * 1000,
    limit: 30,
    keyGenerator: (req) => String(req.auth?.id || "anon"),
  },
  "Too many replies sent. Please wait a few minutes.",
);
