"use strict";
const RideActivity = require("../models/RideActivity");
const Notification = require("../models/Notification");
const Referral = require("../models/Referral");
const SupportReport = require("../models/SupportReport");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const rides = require("../services/rideActivity");
const referrals = require("../services/referrals");

exports.rides = asyncHandler(async (req, res) => {
  const { page, limit, filter } = req.q;
  const f = { user: req.auth.id }; // ownership is part of the query
  if (filter === "cancelled") f.cancelledAt = { $ne: null };
  if (filter === "open") f.cancelledAt = null;
  const [rows, total] = await Promise.all([
    RideActivity.find(f)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    RideActivity.countDocuments(f),
  ]);
  return ok(res, "Rides loaded.", {
    items: rows.map(rides.view),
    total,
    page,
    limit,
  });
});

exports.notifications = asyncHandler(async (req, res) => {
  const { page, limit, unread } = req.q;
  const f = {
    user: req.auth.id,
    ...(unread === "true" ? { readAt: null } : {}),
  };
  const [rows, total, unreadCount] = await Promise.all([
    Notification.find(f)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(f),
    Notification.countDocuments({ user: req.auth.id, readAt: null }),
  ]);
  const items = rows.map((n) => ({
    id: String(n._id),
    type: n.type,
    title: n.title,
    body: n.body,
    read: Boolean(n.readAt),
    createdAt: n.createdAt,
  }));
  return ok(res, "Notifications loaded.", {
    items,
    total,
    page,
    limit,
    unreadCount,
  });
});

exports.markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const hit = await Notification.findOneAndUpdate(
    { _id: id, user: req.auth.id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  if (!hit && !(await Notification.exists({ _id: id, user: req.auth.id })))
    throw new AppError(404, "NOT_FOUND", "Notification not found.");
  return ok(res, "Marked as read.", { id });
});

exports.readAll = asyncHandler(async (req, res) => {
  const r = await Notification.updateMany(
    { user: req.auth.id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  return ok(res, "All notifications marked as read.", {
    updated: r.modifiedCount,
  });
});

exports.referral = asyncHandler(async (req, res) => {
  const code = await referrals.ensureCode(req.auth.id);
  const [total, qualified, me] = await Promise.all([
    Referral.countDocuments({ referrer: req.auth.id }),
    Referral.countDocuments({ referrer: req.auth.id, status: "QUALIFIED" }),
    User.findById(req.auth.id).select("referredBy createdAt").lean(),
  ]);
  const canClaim =
    !me.referredBy &&
    Date.now() - new Date(me.createdAt).getTime() <= referrals.CLAIM_WINDOW_MS;
  return ok(res, "Referral loaded.", {
    code,
    total,
    qualified,
    pending: total - qualified,
    referredByCode: Boolean(me.referredBy),
    canClaim,
  });
});

exports.claimReferral = asyncHandler(async (req, res) =>
  ok(
    res,
    "Referral code applied.",
    await referrals.claim({ userId: req.auth.id, code: req.body.code }),
  ),
);

exports.report = asyncHandler(async (req, res) => {
  const { category, message, rideId } = req.body;
  if (
    rideId &&
    !(await RideActivity.exists({ _id: rideId, user: req.auth.id }))
  )
    throw new AppError(404, "NOT_FOUND", "That ride was not found.");
  await SupportReport.create({
    user: req.auth.id,
    category,
    message,
    rideActivity: rideId,
  });
  return created(res, "Thanks. Your report has been received.", {});
});
