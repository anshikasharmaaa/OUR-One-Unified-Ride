"use strict";
const mongoose = require("mongoose");
const { SEARCH_VEHICLES } = require("../config/constants");

const place = new mongoose.Schema(
  {
    placeId: { type: String, required: true, maxlength: 300 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
);

// One computed comparison, owned by one signed-in user. Fares are never stored unless they came from a real source (see options.js).
const comparisonSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pickup: { type: place, required: true },
    dropoff: { type: place, required: true },
    vehicleType: { type: String, enum: SEARCH_VEHICLES, default: "ANY" },
    route: {
      distanceMeters: { type: Number, required: true },
      durationSeconds: { type: Number, required: true },
      encodedPolyline: { type: String, required: true },
      provider: { type: String, default: "OSRM" },
      computedAt: { type: Date, default: Date.now },
    },
    options: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
);

comparisonSchema.index({ user: 1, createdAt: -1 });
// Locations are personal data: records expire after 180 days (same rule as search records).
if (process.env.SKIP_ADVANCED_INDEXES !== "true")
  comparisonSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 86400 });

module.exports = mongoose.model("Comparison", comparisonSchema);
