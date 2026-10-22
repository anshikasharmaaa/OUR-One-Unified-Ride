"use strict";
const mongoose = require("mongoose");
const {
  ROLES,
  USER_STATUS,
  APPROVAL,
  GENDERS,
  AVATAR_COLORS,
} = require("../config/constants");

const MOBILE = /^[6-9]\d{9}$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
    },
    passwordHash: { type: String, select: false }, // absent for Google-only accounts
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      required: true,
    },
    emailVerified: { type: Boolean, default: false },
    googleSubject: { type: String },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    // No schema default: accounts created before the approval rule have no value and are treated as approved.
    approvalStatus: { type: String, enum: Object.values(APPROVAL) },

    // ---- Profile (all optional; existing accounts keep working without them) ----
    phone: { type: String, trim: true, match: MOBILE },
    gender: { type: String, enum: GENDERS },
    dateOfBirth: { type: Date },
    emergencyContact: {
      name: { type: String, trim: true, maxlength: 80 },
      phone: { type: String, trim: true, match: MOBILE },
    },
    avatarColor: { type: String, enum: AVATAR_COLORS },
    avatarVersion: { type: Number, default: 0 }, // > 0 means a photo exists in the Avatar collection

    // ---- Referrals (written only by the referral service, never by the profile API) ----
    referralCode: { type: String, uppercase: true, trim: true, maxlength: 20 },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Set when the account is deleted and anonymised (see services/accountDeletion.js).
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

if (process.env.SKIP_ADVANCED_INDEXES === "true") {
  userSchema.index({ googleSubject: 1 });
  userSchema.index({ referralCode: 1 });
} else {
  userSchema.index(
    { googleSubject: 1 },
    {
      unique: true,
      partialFilterExpression: { googleSubject: { $type: "string" } },
    },
  );
  userSchema.index(
    { referralCode: 1 },
    {
      unique: true,
      partialFilterExpression: { referralCode: { $type: "string" } },
    },
  );
}
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
