'use strict';
const mongoose = require('mongoose');
const { OTP_PURPOSE } = require('../config/constants');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  purpose: { type: String, enum: Object.values(OTP_PURPOSE), required: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  consumed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });
// Housekeeping only: verification logic always checks expiresAt itself.
if (process.env.SKIP_ADVANCED_INDEXES !== 'true') otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model('Otp', otpSchema);
