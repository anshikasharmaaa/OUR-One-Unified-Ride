"use strict";
const asyncHandler = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const env = require("../config/env");
const registry = require("../services/providers/providerRegistry");
const compareSvc = require("../services/rideComparisonService");
const bookingSvc = require("../services/rideBookingService");

exports.providers = asyncHandler(async (_req, res) =>
  ok(res, "Providers loaded.", {
    dataMode: env.rides.dataMode,
    providers: registry.describe(),
  }),
);

exports.compare = asyncHandler(async (req, res) => {
  const { comparisonId, categories } = req.q;
  const comparison = await compareSvc.loadOwned(comparisonId, req.auth.id);
  return ok(
    res,
    "Estimates ready.",
    await compareSvc.compare({ comparison, categories }),
  );
});

exports.book = asyncHandler(async (req, res) =>
  created(
    res,
    "Demo booking created.",
    await bookingSvc.create({ userId: req.auth.id, ...req.body }),
  ),
);

exports.getBooking = asyncHandler(async (req, res) =>
  ok(res, "Booking loaded.", await bookingSvc.get(req.params.id, req.auth.id)),
);

exports.cancel = asyncHandler(async (req, res) =>
  ok(
    res,
    "Booking cancelled.",
    await bookingSvc.cancel(req.params.id, req.auth.id),
  ),
);

exports.providerOpened = asyncHandler(async (req, res) =>
  ok(
    res,
    "Recorded.",
    await bookingSvc.providerOpened(req.params.id, req.auth.id),
  ),
);
