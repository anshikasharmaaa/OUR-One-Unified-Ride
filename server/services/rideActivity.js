"use strict";
const RideActivity = require("../models/RideActivity");
const { notify } = require("./notifications");
const referrals = require("./referrals");
const logger = require("../utils/logger");

const NAMES = { ola: "Ola", uber: "Uber", rapido: "Rapido" };
const LABEL = {
  COMPARED: "Fares compared",
  DEMO_BOOKED: "Demo booking (simulated)",
  DEMO_CANCELLED: "Demo booking cancelled (simulated)",
};
const NOTE = {
  COMPARED: "You compared fares. No booking was made.",
  DEMO_BOOKED: "A simulated booking. Nothing was requested from the provider.",
  DEMO_CANCELLED: "The simulated booking was cancelled by you.",
};

const iso = (d) => (d ? new Date(d).toISOString() : null);
const view = (r) => ({
  id: String(r._id),
  pickup: r.pickup,
  dropoff: r.dropoff,
  requestedVehicle: r.requestedVehicle,
  distanceMeters: r.distanceMeters ?? null,
  durationSeconds: r.durationSeconds ?? null,
  status: r.status,
  statusLabel: LABEL[r.status],
  statusNote: NOTE[r.status],
  provider: r.provider || null,
  providerName: r.provider ? NAMES[r.provider] || r.provider : null,
  vehicleType: r.vehicleType || null,
  fare: r.fare?.min != null ? r.fare : null,
  fareSource: r.fareSource || null,
  bookingReference: r.bookingReference || null,
  cancelledAt: iso(r.cancelledAt),
  events: (r.events || []).map((e) => ({
    type: e.type,
    label: LABEL[e.type],
    at: iso(e.at),
    provider: e.provider ? NAMES[e.provider] || e.provider : null,
    reference: e.reference || null,
  })),
  createdAt: iso(r.createdAt),
});

// History recording is best effort: it must never block a comparison or booking, but failures are logged.
const guard =
  (label, fn) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      logger.warn({ message: e.message }, `ride activity (${label}) failed`);
      return null;
    }
  };

const place = (p) => ({
  address: String(p.address).slice(0, 300),
  lat: p.lat,
  lng: p.lng,
});
const ensure = (userId, c) =>
  RideActivity.updateOne(
    { comparison: c._id },
    {
      $setOnInsert: {
        user: userId,
        pickup: place(c.pickup),
        dropoff: place(c.dropoff),
        requestedVehicle: c.vehicleType || "ANY",
        distanceMeters: c.route?.distanceMeters,
        durationSeconds: c.route?.durationSeconds,
        status: "COMPARED",
        events: [{ type: "COMPARED", at: new Date() }],
      },
    },
    { upsert: true },
  );

const recordComparison = guard("comparison", async ({ userId, comparison }) => {
  await ensure(userId, comparison);
  await referrals.qualify(userId);
});

const recordDemoBooking = guard(
  "booking",
  async ({
    userId,
    comparison,
    provider,
    vehicleType,
    fare,
    fareSource,
    reference,
  }) => {
    await ensure(userId, comparison);
    await RideActivity.updateOne(
      { comparison: comparison._id, user: userId },
      {
        $set: {
          status: "DEMO_BOOKED",
          provider,
          vehicleType,
          fare,
          fareSource,
          bookingReference: reference,
          cancelledAt: null,
        },
        $push: {
          events: {
            $each: [
              {
                type: "DEMO_BOOKED",
                at: new Date(),
                provider,
                vehicleType,
                reference,
              },
            ],
            $slice: -50,
          },
        },
      },
    );
    await notify(
      userId,
      "BOOKING_UPDATE",
      "Demo booking created",
      `Reference ${reference}. This was simulated: nothing was requested from ${NAMES[provider] || provider}.`,
    );
  },
);

const recordCancelled = guard("cancel", async ({ userId, booking }) => {
  const now = new Date();
  await RideActivity.updateOne(
    { comparison: booking.comparison, user: userId },
    {
      $set: { status: "DEMO_CANCELLED", cancelledAt: now },
      $push: {
        events: {
          $each: [
            {
              type: "DEMO_CANCELLED",
              at: now,
              provider: booking.provider,
              vehicleType: booking.vehicleType,
              reference: booking.reference,
            },
          ],
          $slice: -50,
        },
      },
    },
  );
  await notify(
    userId,
    "BOOKING_UPDATE",
    "Demo booking cancelled",
    `Reference ${booking.reference} was cancelled. It was a simulated booking.`,
  );
});

module.exports = { view, recordComparison, recordDemoBooking, recordCancelled };
