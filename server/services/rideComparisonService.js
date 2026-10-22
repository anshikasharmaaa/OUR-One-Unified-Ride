"use strict";
const Comparison = require("../models/Comparison");
const AppError = require("../utils/AppError");
const env = require("../config/env");
const registry = require("./providers/providerRegistry");
const { normalizeEstimate } = require("./rideEstimate");
const { CATEGORY_LABEL } = require("./fareOptions");

const finite = (n) => typeof n === "number" && Number.isFinite(n);
const okPoint = (p) =>
  p &&
  finite(p.lat) &&
  finite(p.lng) &&
  p.lat >= -90 &&
  p.lat <= 90 &&
  p.lng >= -180 &&
  p.lng <= 180;

async function loadOwned(id, userId) {
  const doc = await Comparison.findOne({ _id: id, user: userId }).lean();
  if (!doc)
    throw new AppError(404, "NOT_FOUND", "That comparison was not found.");
  if (
    !okPoint(doc.pickup) ||
    !okPoint(doc.dropoff) ||
    !finite(doc.route?.distanceMeters) ||
    !finite(doc.route?.durationSeconds)
  )
    throw new AppError(
      422,
      "INVALID_LOCATION",
      "This comparison has an invalid pickup, drop-off or route.",
    );
  return doc;
}

async function compare({ comparison, categories = [] }) {
  const ctx = {
    comparisonId: String(comparison._id),
    route: {
      distanceMeters: comparison.route.distanceMeters,
      durationSeconds: comparison.route.durationSeconds,
    },
    pickup: comparison.pickup,
    dropoff: comparison.dropoff,
    categories,
  };
  const results = await registry.estimateAll(ctx);
  const providers = [];
  const estimates = [];
  for (const r of results) {
    const valid = [];
    let dropped = 0;
    for (const raw of r.estimates) {
      const n = normalizeEstimate(raw); // partial / invalid provider data is dropped, never displayed
      if (!n) {
        dropped++;
        continue;
      }
      valid.push({
        id: `${n.provider}-${n.vehicleType}`,
        providerName: r.name,
        vehicleLabel: CATEGORY_LABEL[n.vehicleType.toUpperCase()],
        ...n,
      });
    }
    let { state, message } = r;
    if (["live", "sandbox", "demo"].includes(state) && valid.length === 0) {
      state = dropped ? "error" : "unavailable";
      message = dropped
        ? `${r.name} returned incomplete data.`
        : `${r.name} has no estimates for this trip.`;
    } else if (dropped) {
      message =
        `${message} Some options were hidden because the provider data was incomplete.`.trim();
    }
    providers.push({ id: r.id, name: r.name, state, message });
    estimates.push(...valid);
  }
  return {
    comparisonId: ctx.comparisonId,
    dataMode: env.rides.dataMode,
    generatedAt: new Date().toISOString(),
    providers,
    estimates,
  };
}

/** Booking re-prices on the server, so the client can never choose its own fare. */
async function estimateFor(comparison, provider, vehicleType) {
  const { estimates } = await compare({
    comparison,
    categories: [vehicleType],
  });
  const est = estimates.find(
    (e) => e.provider === provider && e.vehicleType === vehicleType,
  );
  if (!est)
    throw new AppError(
      409,
      "ESTIMATE_UNAVAILABLE",
      "That ride option isn't available right now. Please refresh the estimates.",
    );
  return est;
}
module.exports = { loadOwned, compare, estimateFor };
