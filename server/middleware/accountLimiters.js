"use strict";
const rateLimit = require("express-rate-limit");
const env = require("../config/env");
const AppError = require("../utils/AppError");

/**
 * Per-user limiters for sensitive account actions. Mounted AFTER requireAuth, so req.auth.id always exists:
 * one user can't use another's quota, and people behind a shared network don't block each other.
 */
const make = ({ windowMs, limit, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: () => env.rateLimitDisabled,
    keyGenerator: (req) => String(req.auth?.id || "anonymous"),
    handler: (_req, _res, next) =>
      next(new AppError(429, "RATE_LIMITED", message)),
  });

const MIN = 60 * 1000;

module.exports = {
  passwordLimiter: make({
    windowMs: 15 * MIN,
    limit: 5,
    skipSuccessfulRequests: true,
    message:
      "Too many password attempts. Please wait a few minutes and try again.",
  }),
  deleteLimiter: make({
    windowMs: 60 * MIN,
    limit: 3,
    skipSuccessfulRequests: true,
    message:
      "Too many attempts to delete this account. Please try again later.",
  }),
  referralLimiter: make({
    windowMs: 60 * MIN,
    limit: 10,
    skipSuccessfulRequests: true,
    message: "Too many referral code attempts. Please try again later.",
  }),
  avatarLimiter: make({
    windowMs: 10 * MIN,
    limit: 10,
    message: "Too many photo changes. Please wait a few minutes.",
  }),
  profileLimiter: make({
    windowMs: 10 * MIN,
    limit: 30,
    message: "You're saving changes very quickly. Please wait a few minutes.",
  }),
  favoritesLimiter: make({
    windowMs: 10 * MIN,
    limit: 60,
    message:
      "You're changing saved places very quickly. Please wait a few minutes.",
  }),
  providerOpenedLimiter: make({
    windowMs: 10 * MIN,
    limit: 30,
    message: "Too many requests. Please wait a few minutes.",
  }),
};
