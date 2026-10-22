"use strict";
const mongoose = require("mongoose");
const { REFERRAL_STATUS } = require("../config/constants");

// Links a referrer to someone who applied their code. One referral per referred user (unique index) blocks duplicate attribution.
const referralSchema = new mongoose.Schema(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    code: { type: String, required: true, maxlength: 20 },
    status: {
      type: String,
      enum: Object.values(REFERRAL_STATUS),
      default: REFERRAL_STATUS.PENDING,
    },
    qualifiedAt: { type: Date },
  },
  { timestamps: true },
);
referralSchema.index({ referrer: 1, status: 1 });

module.exports = mongoose.model("Referral", referralSchema);
