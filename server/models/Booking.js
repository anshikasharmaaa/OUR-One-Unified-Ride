"use strict";
const mongoose = require("mongoose");
const { PROVIDER_IDS, RIDE_VEHICLES } = require("../config/constants");

const place = new mongoose.Schema(
  {
    placeId: { type: String, maxlength: 300 },
    address: { type: String, required: true, maxlength: 300 },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
);
const driver = new mongoose.Schema(
  {
    name: String,
    rating: Number,
    vehicleModel: String,
    plate: String,
    isSimulated: { type: Boolean, default: true },
  },
  { _id: false },
);

// A SIMULATED booking. bookingMode is "demo" only: nothing here is ever sent to a ride provider.
const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    comparison: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comparison",
      required: true,
    },
    reference: { type: String, required: true, unique: true },
    provider: { type: String, enum: PROVIDER_IDS, required: true },
    vehicleType: { type: String, enum: RIDE_VEHICLES, required: true },
    bookingMode: { type: String, enum: ["demo"], default: "demo" },
    pickup: { type: place, required: true },
    dropoff: { type: place, required: true },
    fare: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
      currency: { type: String, required: true },
    },
    fareSource: {
      type: String,
      enum: ["live", "sandbox", "demo"],
      required: true,
    },
    etaMinutes: { type: Number, default: null },
    route: {
      distanceMeters: Number,
      durationSeconds: Number,
      encodedPolyline: String,
    },
    driver: { type: driver, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true },
);
bookingSchema.index({ user: 1, createdAt: -1 });
// Locations are personal data: same 180-day expiry as comparisons.
if (process.env.SKIP_ADVANCED_INDEXES !== "true")
  bookingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 86400 });

module.exports = mongoose.model("Booking", bookingSchema);
