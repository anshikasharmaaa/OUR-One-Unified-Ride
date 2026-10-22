"use strict";
const crypto = require("crypto");
const Booking = require("../models/Booking");
const AppError = require("../utils/AppError");
const env = require("../config/env");
const registry = require("./providers/providerRegistry");
const compareSvc = require("./rideComparisonService");
const rideEvents = require("./rideEvents");
const { notify } = require("./notifications");
const { CATEGORY_LABEL } = require("./fareOptions");
const { pickDriver } = require("../config/demoDrivers");
const { STEPS, progressFor } = require("./bookingTimeline");
const { RIDE_EVENT, NOTIFICATION } = require("../config/constants");

const DISCLOSURE =
  "This is a simulated booking. No ride has been requested from or accepted by the provider.";

function view(b, now = Date.now()) {
  const p = progressFor(
    {
      createdAt: b.createdAt,
      cancelledAt: b.cancelledAt,
      hasDriver: !!b.driver,
      etaMinutes: b.etaMinutes,
    },
    now,
  );
  return {
    id: String(b._id),
    comparisonId: String(b.comparison),
    reference: b.reference,
    mode: b.bookingMode,
    provider: b.provider,
    providerName: registry.get(b.provider)?.name ?? b.provider,
    vehicleType: b.vehicleType,
    vehicleLabel: CATEGORY_LABEL[b.vehicleType.toUpperCase()],
    status: p.status,
    statusLabel: p.statusLabel,
    stepIndex: p.stepIndex,
    steps: STEPS.map(({ key, label }) => ({ key, label })),
    settled: p.settled,
    driverApproach: p.approach,
    etaMinutesRemaining: p.etaMinutesRemaining,
    pickup: b.pickup,
    dropoff: b.dropoff,
    fare: b.fare,
    fareSource: b.fareSource,
    etaMinutes: b.etaMinutes,
    route: b.route,
    driver: p.showDriver ? b.driver : null,
    providerLink: registry.deepLink(b.provider, {
      pickup: b.pickup,
      dropoff: b.dropoff,
      vehicleType: b.vehicleType,
    }),
    disclosure: DISCLOSURE,
    createdAt: b.createdAt,
    cancelledAt: b.cancelledAt,
  };
}

const mineOr404 = async (id, userId) => {
  const doc = await Booking.findOne({ _id: id, user: userId }).lean();
  if (!doc) throw new AppError(404, "NOT_FOUND", "That booking was not found.");
  return doc;
};

async function create({ userId, comparisonId, provider, vehicleType }) {
  const comparison = await compareSvc.loadOwned(comparisonId, userId);
  const recent = await Booking.findOne({
    user: userId,
    comparison: comparison._id,
    provider,
    vehicleType,
    cancelledAt: null,
    createdAt: { $gte: new Date(Date.now() - 15000) }, // double-click guard
  })
    .sort({ createdAt: -1 })
    .lean();
  if (recent) return view(recent);

  const est = await compareSvc.estimateFor(comparison, provider, vehicleType);
  const reference = `OUR-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  const doc = await Booking.create({
    user: userId,
    comparison: comparison._id,
    reference,
    provider,
    vehicleType,
    bookingMode: "demo",
    pickup: comparison.pickup,
    dropoff: comparison.dropoff,
    fare: est.fare,
    fareSource: est.source,
    etaMinutes: est.etaMinutes,
    route: {
      distanceMeters: comparison.route.distanceMeters,
      durationSeconds: comparison.route.durationSeconds,
      encodedPolyline: comparison.route.encodedPolyline,
    },
    driver: env.rides.demoDrivers ? pickDriver(vehicleType, reference) : null,
  });
  const plain = doc.toObject();
  await rideEvents.record(
    userId,
    RIDE_EVENT.DEMO_BOOKING_CREATED,
    rideEvents.fromBooking(plain),
  );
  return view(plain);
}

const get = async (id, userId) => view(await mineOr404(id, userId));

async function cancel(id, userId) {
  const done = await Booking.findOneAndUpdate(
    { _id: id, user: userId, cancelledAt: null },
    { $set: { cancelledAt: new Date() } },
    { new: true },
  ).lean();
  if (done) {
    // Recorded only when THIS call actually cancelled it. Idempotent repeats and page exits never create a cancellation.
    await rideEvents.record(
      userId,
      RIDE_EVENT.DEMO_BOOKING_CANCELLED,
      rideEvents.fromBooking(done),
    );
    await notify(userId, {
      type: NOTIFICATION.DEMO_BOOKING_CANCELLED,
      title: "Demo booking cancelled",
      body: `Booking ${done.reference} was cancelled. It was a simulation, so nothing was cancelled with a provider.`,
      link: "/profile/rides",
    });
  }
  return view(done || (await mineOr404(id, userId))); // already-cancelled bookings return as they are (idempotent)
}

/** The rider continued to the provider. OUR cannot know whether a booking was made there. */
async function providerOpened(id, userId) {
  const b = await mineOr404(id, userId);
  const link = registry.deepLink(b.provider, {
    pickup: b.pickup,
    dropoff: b.dropoff,
    vehicleType: b.vehicleType,
  });
  if (!link.available)
    throw new AppError(
      409,
      "LINK_UNAVAILABLE",
      link.reason || "No provider link is available for this booking.",
    );
  await rideEvents.create(
    userId,
    RIDE_EVENT.PROVIDER_OPENED,
    rideEvents.fromBooking(b),
  );
  return { recorded: true };
}

module.exports = { create, get, cancel, view, providerOpened };
