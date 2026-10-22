"use strict";
const mongoose = require("mongoose");
const { RIDE_VEHICLES } = require("../config/constants");

// A provider OUR lists. A record never implies a live fare integration: that exists only if the code has an adapter for the slug.
const providerSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 30,
    },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    logoUrl: { type: String, default: null, maxlength: 300 }, // https URL or /assets/ path, never fetched by the server
    websiteUrl: { type: String, default: null, maxlength: 300 }, // display only
    categories: { type: [{ type: String, enum: RIDE_VEHICLES }], default: [] }, // [] = the integration's own defaults
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 100 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Provider", providerSchema);
