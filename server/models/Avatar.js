"use strict";
const mongoose = require("mongoose");

// One small (browser-resized) profile photo per user, kept apart from the User document so user queries stay light.
const avatarSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    contentType: {
      type: String,
      enum: ["image/jpeg", "image/png", "image/webp"],
      required: true,
    },
    data: { type: Buffer, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Avatar", avatarSchema);
