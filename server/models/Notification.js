"use strict";
const mongoose = require("mongoose");
const { NOTIFICATION } = require("../config/constants");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(NOTIFICATION), required: true },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, default: "", maxlength: 400 },
    link: { type: String, default: "", maxlength: 120 }, // internal path only
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, readAt: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
