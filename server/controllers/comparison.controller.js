"use strict";
const Comparison = require("../models/Comparison");
const { RideSearch } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const logger = require("../utils/logger");
const maps = require("../services/maps");
const { optionsFor } = require("../services/comparison");
const rideEvents = require("../services/rideEvents");
const { RIDE_EVENT } = require("../config/constants");

const view = (d) => ({
  id: String(d._id),
  pickup: d.pickup,
  dropoff: d.dropoff,
  vehicleType: d.vehicleType,
  route: {
    distanceMeters: d.route.distanceMeters,
    durationSeconds: d.route.durationSeconds,
    encodedPolyline: d.route.encodedPolyline,
    provider: d.route.provider,
    computedAt: d.route.computedAt,
  },
  options: d.options,
  createdAt: d.createdAt,
});

// Ownership is part of the query: another user's id is indistinguishable from a missing one (404, never 403).
const mineOr404 = async (id, userId) => {
  const doc = await Comparison.findOne({ _id: id, user: userId }).lean();
  if (!doc)
    throw new AppError(404, "NOT_FOUND", "That comparison was not found.");
  return doc;
};

exports.create = asyncHandler(async (req, res) => {
  const { pickup, dropoff, vehicleType } = req.body;

  // Double-click / retry guard: the same trip by the same user in the last 15 s returns the existing record.
  const recent = await Comparison.findOne({
    user: req.auth.id,
    "pickup.placeId": pickup.placeId,
    "dropoff.placeId": dropoff.placeId,
    createdAt: { $gte: new Date(Date.now() - 15000) },
  })
    .sort({ createdAt: -1 })
    .lean();
  if (recent) return ok(res, "Comparison ready.", view(recent));

  const route = await maps.computeRoute(pickup, dropoff); // throws AppError(422/502/503), never substituted with fake data
  const options = await optionsFor({ route, pickup, dropoff });
  const doc = await Comparison.create({
    user: req.auth.id,
    pickup,
    dropoff,
    vehicleType,
    route,
    options,
  });
  const plain = doc.toObject();

  // Keep the admin "searches" statistics working: record the search as before (best effort, never blocks the user).
  RideSearch.create({
    pickup: pickup.address.slice(0, 120),
    dropoff: dropoff.address.slice(0, 120),
    vehicleType,
    user: req.auth.id,
  }).catch((e) =>
    logger.warn({ message: e.message }, "could not record search"),
  );

  // Permanent ride history (best effort). Only a genuinely new comparison is recorded, never the de-duplicated retry above.
  await rideEvents.record(
    req.auth.id,
    RIDE_EVENT.COMPARISON_CREATED,
    rideEvents.fromComparison(plain),
  );

  return created(res, "Comparison ready.", view(plain));
});

exports.get = asyncHandler(async (req, res) =>
  ok(
    res,
    "Comparison loaded.",
    view(await mineOr404(req.params.id, req.auth.id)),
  ),
);

exports.list = asyncHandler(async (req, res) => {
  const { page, limit } = req.q;
  const filter = { user: req.auth.id };
  const [rows, total] = await Promise.all([
    Comparison.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "pickup dropoff route.distanceMeters route.durationSeconds createdAt",
      )
      .lean(),
    Comparison.countDocuments(filter),
  ]);
  const items = rows.map((d) => ({
    id: String(d._id),
    pickup: d.pickup.address,
    dropoff: d.dropoff.address,
    distanceMeters: d.route.distanceMeters,
    durationSeconds: d.route.durationSeconds,
    createdAt: d.createdAt,
  }));
  return ok(res, "Comparisons loaded.", { items, total, page, limit });
});
