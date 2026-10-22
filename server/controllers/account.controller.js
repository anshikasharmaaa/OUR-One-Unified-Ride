"use strict";
const User = require("../models/User");
const Avatar = require("../models/Avatar");
const Session = require("../models/Session");
const Otp = require("../models/Otp");
const Booking = require("../models/Booking");
const Comparison = require("../models/Comparison");
const RideSearch = require("../models/RideSearch");
const RideActivity = require("../models/RideActivity");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/response");
const { verifyPassword, hashPassword } = require("../services/passwords");
const {
  revokeAllForAccount,
  clearRefreshCookie,
} = require("../services/sessions");
const { notify } = require("../services/notifications");

const profileView = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  emailVerified: u.emailVerified,
  phone: u.phone || null,
  gender: u.gender || null,
  dateOfBirth: u.dateOfBirth
    ? new Date(u.dateOfBirth).toISOString().slice(0, 10)
    : null,
  emergencyContact: u.emergencyContact
    ? { name: u.emergencyContact.name, phone: u.emergencyContact.phone }
    : null,
  memberSince: u.createdAt,
  hasAvatar: (u.avatarVersion || 0) > 0,
  avatarVersion: u.avatarVersion || 0,
  hasPassword: Boolean(u.passwordHash),
  hasGoogle: Boolean(u.googleSubject),
});
const load = (id) => User.findById(id).select("+passwordHash");

exports.getProfile = asyncHandler(async (req, res) =>
  ok(res, "Profile loaded.", profileView(await load(req.auth.id))),
);

exports.updateProfile = asyncHandler(async (req, res) => {
  const b = req.body;
  const u = await load(req.auth.id);
  if (b.name !== undefined) u.name = b.name;
  if (b.phone !== undefined) u.phone = b.phone || undefined;
  if (b.gender !== undefined) u.gender = b.gender || undefined;
  if (b.dateOfBirth !== undefined) {
    if (!b.dateOfBirth) u.dateOfBirth = undefined;
    else {
      const d = new Date(`${b.dateOfBirth}T00:00:00Z`);
      if (
        Number.isNaN(d.getTime()) ||
        d > new Date() ||
        d.getUTCFullYear() < 1900
      )
        throw new AppError(400, "INVALID_DOB", "Enter a valid date of birth.");
      u.dateOfBirth = d;
    }
  }
  if (b.emergencyContact !== undefined) {
    const { name, phone } = b.emergencyContact;
    if (Boolean(name) !== Boolean(phone))
      throw new AppError(
        400,
        "INVALID_EMERGENCY_CONTACT",
        "Add both a name and a phone number for your emergency contact, or leave both empty.",
      );
    u.emergencyContact = name ? { name, phone } : undefined;
  }
  await u.save();
  await notify(
    u._id,
    "PROFILE_UPDATED",
    "Profile updated",
    "Your profile details were changed.",
  );
  return ok(res, "Profile updated.", profileView(u));
});

const sniff = (b) => {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "image/png";
  if (
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WEBP"
  )
    return "image/webp";
  return null;
};

exports.putAvatar = asyncHandler(async (req, res) => {
  const buf = req.body;
  const type = Buffer.isBuffer(buf) && buf.length ? sniff(buf) : null; // the file's real bytes decide, not the header
  if (!type)
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "Choose a JPEG, PNG or WebP image.",
    );
  await Avatar.findOneAndUpdate(
    { user: req.auth.id },
    { $set: { contentType: type, data: buf } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  const u = await User.findByIdAndUpdate(
    req.auth.id,
    { $inc: { avatarVersion: 1 } },
    { new: true },
  ).select("+passwordHash");
  return ok(res, "Photo updated.", profileView(u));
});

exports.getAvatar = asyncHandler(async (req, res) => {
  const a = await Avatar.findOne({ user: req.auth.id }).lean();
  if (!a) throw new AppError(404, "NOT_FOUND", "No profile photo.");
  res.set({
    "Content-Type": a.contentType,
    "X-Content-Type-Options": "nosniff",
  });
  return res.send(a.data.buffer ? Buffer.from(a.data.buffer) : a.data);
});

exports.deleteAvatar = asyncHandler(async (req, res) => {
  await Avatar.deleteOne({ user: req.auth.id });
  const u = await User.findByIdAndUpdate(
    req.auth.id,
    { $set: { avatarVersion: 0 } },
    { new: true },
  ).select("+passwordHash");
  return ok(res, "Photo removed.", profileView(u));
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const u = await load(req.auth.id);
  if (!u.passwordHash)
    throw new AppError(
      400,
      "NO_PASSWORD",
      "This account signs in with Google, so there is no password to change.",
    );
  if (!(await verifyPassword(currentPassword, u.passwordHash)))
    throw new AppError(
      400,
      "INVALID_PASSWORD",
      "Your current password is incorrect.",
    );
  u.passwordHash = await hashPassword(newPassword);
  await u.save();
  // Sign out every other device; this session stays.
  await Session.updateMany(
    {
      principalType: "USER",
      principalId: u._id,
      revokedAt: null,
      family: { $ne: req.auth.family },
    },
    { $set: { revokedAt: new Date() } },
  );
  await notify(
    u._id,
    "PASSWORD_CHANGED",
    "Password changed",
    "Your password was changed and other devices were signed out. If this wasn’t you, reset your password now.",
  );
  return ok(res, "Password changed. Other devices were signed out.", {});
});

// Retained ride history keeps no precise locations: coordinates are rounded and addresses cut to area level.
const r2 = (n) => Math.round(n * 100) / 100;
const blur = (p) => ({
  address:
    String(p.address).split(",").slice(-2).join(",").trim().slice(0, 120) ||
    "Area not recorded",
  lat: r2(p.lat),
  lng: r2(p.lng),
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const u = await load(req.auth.id);
  if (u.passwordHash) {
    if (
      !req.body.password ||
      !(await verifyPassword(req.body.password, u.passwordHash))
    )
      throw new AppError(
        400,
        "INVALID_PASSWORD",
        "Your password is incorrect.",
      );
  } else if (req.body.confirmEmail !== u.email) {
    // Google-only account: there is no password, so the user must retype their email.
    throw new AppError(
      400,
      "CONFIRM_EMAIL",
      "Type your account email to confirm.",
    );
  }
  const id = u._id;
  const oldEmail = u.email;
  await revokeAllForAccount(u);
  await User.updateOne(
    { _id: id },
    {
      $set: {
        name: "Deleted user",
        email: `deleted-${id}@deleted.invalid`,
        emailVerified: false,
        status: "SUSPENDED",
        avatarVersion: 0,
        deletedAt: new Date(),
      },
      $unset: {
        passwordHash: 1,
        googleSubject: 1,
        phone: 1,
        gender: 1,
        dateOfBirth: 1,
        emergencyContact: 1,
        referralCode: 1,
        referredBy: 1,
      },
    },
  );
  await Promise.all([
    Avatar.deleteOne({ user: id }),
    Notification.deleteMany({ user: id }),
    Otp.deleteMany({ email: oldEmail }),
    Comparison.deleteMany({ user: id }),
    Booking.deleteMany({ user: id }),
    RideSearch.deleteMany({ user: id }),
  ]);
  for await (const a of RideActivity.find({ user: id })
    .select("pickup dropoff")
    .lean()
    .cursor()) {
    await RideActivity.updateOne(
      { _id: a._id },
      {
        $set: {
          pickup: blur(a.pickup),
          dropoff: blur(a.dropoff),
          anonymised: true,
        },
      },
    );
  }
  await AuditLog.create({
    actor: id,
    action: "ACCOUNT_DELETED",
    targetUser: id,
    ip: req.ip,
  });
  clearRefreshCookie(res);
  return ok(res, "Your account has been deleted.", {});
});
