"use strict";
const RideEvent = require("../models/RideEvent");
const logger = require("../utils/logger");
const referrals = require("./referrals");
const { RIDE_EVENT } = require("../config/constants");

const OPEN_DEDUPE_MS = 30000; // a repeated "provider opened" for the same booking inside this window is one event

const pt = (p) =>
  p ? { address: p.address, lat: p.lat, lng: p.lng } : undefined;

const fromComparison = (c) => ({
  comparison: c._id,
  vehicleType: c.vehicleType,
  pickup: pt(c.pickup),
  dropoff: pt(c.dropoff),
  distanceMeters: c.route?.distanceMeters,
});

const fromBooking = (b) => ({
  comparison: b.comparison,
  booking: b._id,
  reference: b.reference,
  provider: b.provider,
  vehicleType: b.vehicleType,
  pickup: pt(b.pickup),
  dropoff: pt(b.dropoff),
  fare: b.fare
    ? { min: b.fare.min, max: b.fare.max, currency: b.fare.currency }
    : undefined,
  fareSource: b.fareSource,
  distanceMeters: b.route?.distanceMeters,
});

/** Throws on failure: use where recording IS the action. */
async function create(userId, type, data = {}) {
  let dedupeKey;
  if (type === RIDE_EVENT.PROVIDER_OPENED && data.booking) {
    // Double clicks and client retries must not create a second event.
    const recent = await RideEvent.findOne({
      user: userId,
      booking: data.booking,
      type,
      createdAt: { $gte: new Date(Date.now() - OPEN_DEDUPE_MS) },
    }).lean();
    if (recent) return recent;
    dedupeKey = `${userId}:${data.booking}:${type}:${Math.floor(Date.now() / OPEN_DEDUPE_MS)}`;
  }

  let ev;
  try {
    ev = await RideEvent.create({
      user: userId,
      type,
      ...data,
      ...(dedupeKey ? { dedupeKey } : {}),
    });
  } catch (e) {
    if (e.code === 11000 && dedupeKey)
      return RideEvent.findOne({ dedupeKey }).lean(); // a parallel request won the race
    throw e;
  }

  if (type === RIDE_EVENT.COMPARISON_CREATED)
    await referrals
      .qualifyIfEligible(userId)
      .catch((e) =>
        logger.warn({ message: e.message }, "referral check failed"),
      );
  return ev;
}

/** Best-effort: history logging must never block a rider's comparison or booking. */
async function record(userId, type, data) {
  try {
    return await create(userId, type, data);
  } catch (e) {
    logger.warn({ message: e.message, type }, "could not record ride event");
    return null;
  }
}

const view = (e) => ({
  id: String(e._id),
  type: e.type,
  reference: e.reference || null,
  provider: e.provider || null,
  vehicleType: e.vehicleType || null,
  pickup: e.pickup?.address || null,
  dropoff: e.dropoff?.address || null,
  fare:
    e.fare?.min != null
      ? { min: e.fare.min, max: e.fare.max, currency: e.fare.currency }
      : null,
  fareSource: e.fareSource || null,
  distanceMeters: e.distanceMeters ?? null,
  createdAt: e.createdAt,
});

module.exports = { create, record, fromComparison, fromBooking, view };
