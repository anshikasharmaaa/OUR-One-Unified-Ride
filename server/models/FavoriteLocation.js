"use strict";
const mongoose = require("mongoose");
const { FAVORITE_LABELS } = require("../config/constants");

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, enum: FAVORITE_LABELS, required: true },
    name: { type: String, trim: true, maxlength: 60, default: "" },
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 300,
    },
    // Present only when the place was picked from the real autocomplete, so it can be used as a pickup or drop-off. Never invented.
    placeId: { type: String, trim: true, maxlength: 300 },
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
  },
  { timestamps: true },
);
favoriteSchema.index({ user: 1, createdAt: -1 });

// One Home and one Work/College per user, enforced by the database (not just a check-then-insert).
if (process.env.SKIP_ADVANCED_INDEXES === "true") {
  favoriteSchema.index({ user: 1, label: 1 });
} else {
  favoriteSchema.index(
    { user: 1, label: 1 },
    {
      name: "one_home_per_user",
      unique: true,
      partialFilterExpression: { label: "HOME" },
    },
  );
  favoriteSchema.index(
    { user: 1, label: 1 },
    {
      name: "one_work_per_user",
      unique: true,
      partialFilterExpression: { label: "WORK" },
    },
  );
}

module.exports = mongoose.model("FavoriteLocation", favoriteSchema);
