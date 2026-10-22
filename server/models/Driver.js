"use strict";
const mongoose = require("mongoose");
const { ROLES, APPROVAL, VEHICLE_TYPES } = require("../config/constants");

const driverSchema = new mongoose.Schema(
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
    mobile: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/,
      unique: true,
    },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    address: { type: String, trim: true, maxlength: 200 },
    vehicleType: { type: String, enum: VEHICLE_TYPES, required: true },
    vehicleModel: { type: String, trim: true, maxlength: 60 },
    vehicleNumber: { type: String, trim: true, uppercase: true, maxlength: 20 },
    licenseNumber: { type: String, trim: true, uppercase: true, maxlength: 24 },
    // address / vehicleModel / vehicleNumber / licenseNumber are validated by the API (zod) for every new
    // registration. They are NOT `required` here so older records can still be saved when an admin
    // approves, rejects or suspends them.
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: [ROLES.DRIVER],
      default: ROLES.DRIVER,
      immutable: true,
    },
    emailVerified: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: Object.values(APPROVAL),
      default: APPROVAL.PENDING,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Driver", driverSchema);
