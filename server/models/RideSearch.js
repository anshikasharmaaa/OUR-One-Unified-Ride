'use strict';
const mongoose = require('mongoose');
const { SEARCH_VEHICLES } = require('../config/constants');

// A record that someone submitted the search form. It is NOT a comparison result: no fares are stored or invented.
const rideSearchSchema = new mongoose.Schema(
  {
    pickup: { type: String, required: true, trim: true, maxlength: 120 },
    dropoff: { type: String, required: true, trim: true, maxlength: 120 },
    vehicleType: { type: String, enum: SEARCH_VEHICLES, default: 'ANY' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // only when a signed-in rider searched
    status: { type: String, enum: ['RECEIVED'], default: 'RECEIVED' },
  },
  { timestamps: true },
);

rideSearchSchema.index({ createdAt: -1 });
// Data minimisation: free-text locations can be personal, so records expire after 180 days.
if (process.env.SKIP_ADVANCED_INDEXES !== 'true') rideSearchSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 86400 });

module.exports = mongoose.model('RideSearch', rideSearchSchema);
