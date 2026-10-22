"use strict";
const RideEvent = require("../models/RideEvent");
const logger = require("../utils/logger");

const DAY = 86400000;
const ROUND_AFTER_DAYS = 180; // same age at which Comparison/Booking records expire
const BATCH = 500;
const MAX_BATCHES = 40; // per run; the next daily run continues
const r2 = (n) => Math.round(n * 100) / 100; // about 1 km: enough for "which area", not "which door"
const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/** Rounds pickup/drop coordinates of old ride events to 2 decimals. Idempotent: each event is processed once. */
async function roundOldCoordinates(now = Date.now()) {
  const filter = {
    createdAt: { $lt: new Date(now - ROUND_AFTER_DAYS * DAY) },
    coordsRounded: { $ne: true },
  };
  let total = 0;
  for (let i = 0; i < MAX_BATCHES; i += 1) {
    // Raw collection: ride history is append-only through Mongoose, and this is the sanctioned exception.
    const docs = await RideEvent.collection
      .find(filter, { projection: { pickup: 1, dropoff: 1 } })
      .limit(BATCH)
      .toArray();
    if (!docs.length) break;
    const ops = docs.map((d) => {
      const $set = { coordsRounded: true };
      ["pickup", "dropoff"].forEach((k) => {
        if (isNum(d[k]?.lat)) $set[`${k}.lat`] = r2(d[k].lat);
        if (isNum(d[k]?.lng)) $set[`${k}.lng`] = r2(d[k].lng);
      });
      return { updateOne: { filter: { _id: d._id }, update: { $set } } };
    });
    await RideEvent.collection.bulkWrite(ops, { ordered: false });
    total += docs.length;
  }
  return total;
}

/** Runs shortly after start and then daily. Timers are unref'd so they never block shutdown. */
function startRetention({ intervalMs = DAY } = {}) {
  const run = () =>
    roundOldCoordinates()
      .then((n) => {
        if (n) logger.info({ count: n }, "rounded old ride-event coordinates");
      })
      .catch((e) =>
        logger.warn({ message: e.message }, "coordinate rounding failed"),
      );
  setTimeout(run, 60000).unref();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return timer;
}

module.exports = { roundOldCoordinates, startRetention, ROUND_AFTER_DAYS };
