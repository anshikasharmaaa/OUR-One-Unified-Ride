"use strict";
const mongoose = require("mongoose");
const { RIDE_EVENT, PROVIDER_IDS } = require("../config/constants");

const place = new mongoose.Schema(
  { address: { type: String, maxlength: 300 }, lat: Number, lng: Number },
  { _id: false },
);

// One verified thing that happened. Append-only snapshots, so history stays readable after the source
// Comparison/Booking documents expire. There is deliberately no TTL index here.
const rideEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(RIDE_EVENT), required: true },
    comparison: { type: mongoose.Schema.Types.ObjectId, ref: "Comparison" },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    reference: { type: String, maxlength: 40 },
    provider: { type: String, enum: PROVIDER_IDS },
    vehicleType: { type: String, maxlength: 20 },
    pickup: place,
    dropoff: place,
    fare: { min: Number, max: Number, currency: String }, // an estimate: never a confirmed fare
    fareSource: { type: String, enum: ["live", "sandbox", "demo"] },
    distanceMeters: Number,
    // Set only on PROVIDER_OPENED: makes a repeated click/retry inside the same time window a no-op.
    dedupeKey: { type: String, maxlength: 120 },
    // True once the 180-day coordinate rounding (services/retention.js) has been applied.
    coordsRounded: { type: Boolean },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

rideEventSchema.index({ user: 1, createdAt: -1 });
rideEventSchema.index({ user: 1, type: 1, createdAt: -1 });
rideEventSchema.index({ createdAt: 1 }); // retention job
if (process.env.SKIP_ADVANCED_INDEXES === "true") {
  rideEventSchema.index({ dedupeKey: 1 });
} else {
  rideEventSchema.index(
    { dedupeKey: 1 },
    {
      unique: true,
      partialFilterExpression: { dedupeKey: { $type: "string" } },
    },
  );
}

// Ride history cannot be edited or deleted through Mongoose. The sanctioned exceptions (location redaction on
// account deletion and the 180-day coordinate rounding) use the raw collection explicitly.
const BLOCKED = [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "findOneAndReplace",
  "replaceOne",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
];
rideEventSchema.pre(BLOCKED, function blockMutation() {
  if (process.env.NODE_ENV !== "test")
    throw new Error("Ride history is append-only.");
});
rideEventSchema.pre("save", function blockResave() {
  if (!this.isNew && process.env.NODE_ENV !== "test")
    throw new Error("Ride history is append-only.");
});

module.exports = mongoose.model("RideEvent", rideEventSchema);
