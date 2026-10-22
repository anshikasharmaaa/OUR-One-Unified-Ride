"use strict";
const mongoose = require("mongoose");

const supportReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["RIDE", "PROVIDER", "APP", "SAFETY", "OTHER"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 1500,
    },
    rideActivity: { type: mongoose.Schema.Types.ObjectId, ref: "RideActivity" },
  },
  { timestamps: true },
);
supportReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model("SupportReport", supportReportSchema);
