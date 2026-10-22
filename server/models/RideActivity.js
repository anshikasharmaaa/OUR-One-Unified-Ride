"use strict";
const mongoose = require("mongoose");
const {
  SEARCH_VEHICLES,
  PROVIDER_IDS,
  RIDE_VEHICLES,
} = require("../config/constants");

const place = new mongoose.Schema(
  {
    address: { type: String, required: true, maxlength: 300 },
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
  },
  { _id: false },
);
const event = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["COMPARED", "DEMO_BOOKED", "DEMO_CANCELLED"],
      required: true,
    },
    at: { type: Date, default: Date.now },
    provider: { type: String, enum: PROVIDER_IDS },
    vehicleType: { type: String, enum: RIDE_VEHICLES },
    reference: { type: String, maxlength: 40 },
  },
  { _id: false },
);

// One record per fare comparison, with an append-only event list. It records only what OUR can verify.
// No "completed" status exists: OUR cannot confirm a real trip.
const rideActivitySchema = new mongoose.Schema(
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
      unique: true,
    },
    pickup: { type: place, required: true },
    dropoff: { type: place, required: true },
    requestedVehicle: { type: String, enum: SEARCH_VEHICLES, default: "ANY" },
    distanceMeters: Number,
    durationSeconds: Number,
    status: {
      type: String,
      enum: ["COMPARED", "DEMO_BOOKED", "DEMO_CANCELLED"],
      required: true,
    },
    provider: { type: String, enum: PROVIDER_IDS },
    vehicleType: { type: String, enum: RIDE_VEHICLES },
    fare: { min: Number, max: Number, currency: String },
    fareSource: { type: String, enum: ["live", "sandbox", "demo"] },
    bookingReference: { type: String, maxlength: 40 },
    cancelledAt: { type: Date, default: null },
    anonymised: { type: Boolean, default: false },
    events: { type: [event], default: [] },
  },
  { timestamps: true },
);
rideActivitySchema.index({ user: 1, createdAt: -1 });

// History is retained: nothing in the application may delete it.
const refuse = function (next) {
  next(new Error("Ride history is retained and cannot be deleted."));
};
rideActivitySchema.pre(["deleteOne", "deleteMany", "findOneAndDelete"], refuse);
rideActivitySchema.pre("deleteOne", { document: true, query: false }, refuse);

module.exports = mongoose.model("RideActivity", rideActivitySchema);
