"use strict";
const rateLimit = require("express-rate-limit");
const env = require("../config/env");

/**
 * Per-user limiters for the OSRM/Nominatim calls and ride estimates.
 * Both are mounted AFTER requireAuth, so req.auth.id always exists. Keying by user id (not IP)
 * means one rider can't burn the quota, and users behind a shared NAT don't block each other.
 */
const make = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.rateLimitDisabled,
    keyGenerator: (req) => String(req.auth?.id || "anonymous"),
    handler: (_req, res) =>
      res.status(429).json({
        success: false,
        message,
        error: { code: "RATE_LIMITED", message },
      }),
  });

// Route calculation = one Routes API call per comparison.
const compareLimiter = make({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  message:
    "You're comparing rides very quickly. Please wait a few minutes and try again.",
});

// Reverse geocoding = once per "Use My Current Location" click.
const geocodeLimiter = make({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message:
    "Too many location lookups. Please wait a few minutes or enter your pickup manually.",
});

// Re-running estimates (incl. "Refresh") and creating demo bookings.
const ridesCompareLimiter = make({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  message:
    "You're refreshing estimates very quickly. Please wait a few minutes.",
});
const bookLimiter = make({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message:
    "Too many booking attempts. Please wait a few minutes and try again.",
});

module.exports = {
  compareLimiter,
  geocodeLimiter,
  ridesCompareLimiter,
  bookLimiter,
};
