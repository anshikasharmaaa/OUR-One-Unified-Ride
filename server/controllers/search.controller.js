'use strict';
const { RideSearch } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/response');

exports.create = asyncHandler(async (req, res) => {
  const { pickup, dropoff, vehicleType } = req.body;
  const doc = await RideSearch.create({
    pickup, dropoff, vehicleType,
    user: req.auth?.role === 'USER' ? req.auth.id : null,
  });
  return created(res, 'Search received. Live fare comparison is not available yet.', {
    id: String(doc._id), status: doc.status, comparisonAvailable: false,
  });
});

// A signed-in rider's own search history (requireAuth + requireRole('USER') are applied on the route).
exports.mine = asyncHandler(async (req, res) => {
  const { page, limit } = req.q;
  const filter = { user: req.auth.id };
  const [rows, total] = await Promise.all([
    RideSearch.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    RideSearch.countDocuments(filter),
  ]);
  const items = rows.map((r) => ({ id: String(r._id), pickup: r.pickup, dropoff: r.dropoff, vehicleType: r.vehicleType, status: r.status, createdAt: r.createdAt }));
  return ok(res, 'Your searches loaded.', { items, total, page, limit });
});
