'use strict';
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    principalType: { type: String, enum: ['USER', 'DRIVER'], required: true },
    principalId: { type: mongoose.Schema.Types.ObjectId, required: true },
    family: { type: String, required: true }, // all rotations of one login share a family
    tokenHash: { type: String, required: true, unique: true }, // HMAC of the opaque refresh token
    remember: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    rotatedAt: { type: Date, default: null },
    replacedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    ip: { type: String },
    userAgent: { type: String, maxlength: 300 },
  },
  { timestamps: true },
);

sessionSchema.index({ principalType: 1, principalId: 1 });
sessionSchema.index({ family: 1 });
if (process.env.SKIP_ADVANCED_INDEXES !== 'true') sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Session', sessionSchema);
