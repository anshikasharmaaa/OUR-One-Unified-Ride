"use strict";
const { computeFare } = require("../fareOptions");
const hash = require("../../utils/hash");

const EXPIRY_MS = 5 * 60 * 1000;

function createDemoEstimator(cfg) {
  const categoriesFor = (id) => cfg.providers[id]?.categories ?? [];

  function estimate(id, name, ctx) {
    const p = cfg.providers[id];
    const wanted = (ctx.categories || []).map((c) => c.toUpperCase());
    const cats = (p?.categories ?? []).filter(
      (c) => !wanted.length || wanted.includes(c),
    );
    if (!cats.length)
      return {
        state: "unavailable",
        estimates: [],
        message: `${name} has no matching ride types in the demo configuration.`,
      };

    const now = Date.now();
    const [lo, hi] = p.etaRange;
    const estimates = cats.map((cat) => {
      const b = cfg.rates[cat];
      const rate = {
        ...b,
        base: b.base * p.scale,
        perKm: b.perKm * p.scale,
        perMin: b.perMin * p.scale,
        minFare: b.minFare * p.scale,
      };
      return {
        provider: id,
        vehicleType: cat.toLowerCase(),
        fare: computeFare(rate, ctx.route, "INR"),
        etaMinutes:
          lo + (hash(`${ctx.comparisonId}:${id}:${cat}`) % (hi - lo + 1)), // deterministic demo value
        distanceKm: Math.round(ctx.route.distanceMeters / 100) / 10,
        durationMinutes: Math.max(
          1,
          Math.round(ctx.route.durationSeconds / 60),
        ),
        availability: {
          status: "unknown",
          message: "Availability not provided",
        },
        source: "demo",
        isLive: false,
        updatedAt: new Date(now).toISOString(),
        expiresAt: new Date(now + EXPIRY_MS).toISOString(),
        bookingMode: "demo",
      };
    });
    return {
      state: "demo",
      estimates,
      message:
        "Demo estimates from illustrative rate cards, not real provider prices.",
    };
  }
  return { categoriesFor, estimate };
}
module.exports = { createDemoEstimator };
