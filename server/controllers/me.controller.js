"use strict";
const { User, RideEvent, Notification, Avatar } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/response");
const { ROLES, NOTIFICATION } = require("../config/constants");
const { hashPassword, verifyPassword } = require("../services/passwords");
const {
  revokeAllForAccount,
  clearRefreshCookie,
} = require("../services/sessions");
const { notify } = require("../services/notifications");
const referrals = require("../services/referrals");
const rideEvents = require("../services/rideEvents");
const { anonymize } = require("../services/accountDeletion");

const iso = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);
const profileView = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  emailVerified: u.emailVerified,
  phone: u.phone || null,
  gender: u.gender || null,
  dateOfBirth: iso(u.dateOfBirth),
  emergencyContact: u.emergencyContact?.phone
    ? { name: u.emergencyContact.name || "", phone: u.emergencyContact.phone }
    : null,
  avatarColor: u.avatarColor || "blue",
  hasAvatar: (u.avatarVersion || 0) > 0,
  avatarVersion: u.avatarVersion || 0,
  memberSince: u.createdAt, // the real account-creation timestamp
  hasPassword: Boolean(u.passwordHash),
  signInMethods: [
    ...(u.passwordHash ? ["Email"] : []),
    ...(u.googleSubject ? ["Google"] : []),
  ],
});

// What the person can see and edit, in one comparable string: used to decide whether a save really changed anything.
const snapshot = (u) =>
  JSON.stringify([
    u.name,
    u.phone || "",
    u.gender || "",
    iso(u.dateOfBirth) || "",
    u.emergencyContact?.name || "",
    u.emergencyContact?.phone || "",
    u.avatarColor || "blue",
  ]);

const loadMe = (id) => User.findById(id).select("+passwordHash");

exports.get = asyncHandler(async (req, res) =>
  ok(res, "Profile loaded.", {
    profile: profileView(await loadMe(req.auth.id)),
  }),
);

exports.update = asyncHandler(async (req, res) => {
  const b = req.body;
  const before = await loadMe(req.auth.id);
  const $set = {};
  const $unset = {};
  const put = (key, value) => {
    if (value === "") $unset[key] = "";
    else $set[key] = value;
  };
  if (b.name !== undefined) $set.name = b.name;
  if (b.phone !== undefined) put("phone", b.phone);
  if (b.gender !== undefined) put("gender", b.gender);
  if (b.dateOfBirth !== undefined)
    put(
      "dateOfBirth",
      b.dateOfBirth === "" ? "" : new Date(`${b.dateOfBirth}T00:00:00Z`),
    );
  if (b.emergencyContact) {
    if (b.emergencyContact.phone)
      $set.emergencyContact = {
        name: b.emergencyContact.name,
        phone: b.emergencyContact.phone,
      };
    else $unset.emergencyContact = "";
  }
  if (b.avatarColor) $set.avatarColor = b.avatarColor;

  const update = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  const user = Object.keys(update).length
    ? await User.findByIdAndUpdate(req.auth.id, update, {
        new: true,
        runValidators: true,
      }).select("+passwordHash")
    : before;

  // Only a real change creates a notification (the form always sends every field).
  if (snapshot(before) !== snapshot(user)) {
    await notify(user._id, {
      type: NOTIFICATION.PROFILE_UPDATED,
      title: "Profile updated",
      body: "Your profile details were saved.",
      link: "/profile",
    });
  }
  return ok(res, "Profile updated.", { profile: profileView(user) });
});

/* ---------- Profile photo (stored in MongoDB for now; swap for Cloudinary later) ---------- */

// The file's real bytes decide the type, never the Content-Type header.
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
  const type = Buffer.isBuffer(buf) && buf.length ? sniff(buf) : null;
  if (!type)
    throw new AppError(
      400,
      "INVALID_IMAGE",
      "Choose a JPEG, PNG or WebP image (150 KB or smaller).",
    );
  await Avatar.findOneAndUpdate(
    { user: req.auth.id },
    { $set: { contentType: type, data: buf } },
    { upsert: true, setDefaultsOnInsert: true },
  );
  const user = await User.findByIdAndUpdate(
    req.auth.id,
    { $inc: { avatarVersion: 1 } },
    { new: true },
  ).select("+passwordHash");
  return ok(res, "Photo updated.", { profile: profileView(user) });
});

exports.getAvatar = asyncHandler(async (req, res) => {
  const a = await Avatar.findOne({ user: req.auth.id }).lean();
  if (!a) throw new AppError(404, "NOT_FOUND", "No profile photo.");
  const data = Buffer.isBuffer(a.data) ? a.data : Buffer.from(a.data.buffer);
  res.set({
    "Content-Type": a.contentType,
    "X-Content-Type-Options": "nosniff",
  });
  return res.send(data);
});

exports.deleteAvatar = asyncHandler(async (req, res) => {
  await Avatar.deleteOne({ user: req.auth.id });
  const user = await User.findByIdAndUpdate(
    req.auth.id,
    { $set: { avatarVersion: 0 } },
    { new: true },
  ).select("+passwordHash");
  return ok(res, "Photo removed.", { profile: profileView(user) });
});

/* ---------- Security ---------- */

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await loadMe(req.auth.id);
  if (!user.passwordHash)
    throw new AppError(
      409,
      "NO_PASSWORD",
      "This account signs in with Google, so it has no password to change.",
    );
  // 400, not 401: a 401 would make the client think the session expired.
  if (!(await verifyPassword(currentPassword, user.passwordHash)))
    throw new AppError(
      400,
      "WRONG_PASSWORD",
      "Your current password is incorrect.",
    );
  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  await revokeAllForAccount(user); // signs out every device, including this one
  clearRefreshCookie(res);
  await notify(user._id, {
    type: NOTIFICATION.PASSWORD_CHANGED,
    title: "Password changed",
    body: "Your password was changed and all devices were signed out.",
  });
  return ok(res, "Password changed. Please sign in again.", {
    signedOut: true,
  });
});

exports.remove = asyncHandler(async (req, res) => {
  const user = await loadMe(req.auth.id);
  if (user.role !== ROLES.USER)
    throw new AppError(
      403,
      "FORBIDDEN",
      "This account cannot be deleted here.",
    );
  if (user.passwordHash) {
    if (
      !req.body.password ||
      !(await verifyPassword(req.body.password, user.passwordHash))
    ) {
      throw new AppError(
        400,
        "WRONG_PASSWORD",
        "Enter your current password to delete your account.",
      );
    }
  } else if (req.body.confirmEmail !== user.email) {
    // Google-only account: no password exists, so the person must retype their account email.
    throw new AppError(
      400,
      "CONFIRM_EMAIL",
      "Type your account email to confirm.",
    );
  }
  // Anonymise first: if a step fails the account is still intact and the person can simply try again.
  await anonymize(user);
  await revokeAllForAccount(user);
  clearRefreshCookie(res);
  return ok(res, "Your account has been deleted.", {});
});

/* ---------- Activity ---------- */

exports.rides = asyncHandler(async (req, res) => {
  const { page, limit, type } = req.q;
  const filter = { user: req.auth.id, ...(type ? { type } : {}) }; // ownership is part of the query
  const [rows, total] = await Promise.all([
    RideEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    RideEvent.countDocuments(filter),
  ]);
  return ok(res, "Ride history loaded.", {
    items: rows.map(rideEvents.view),
    total,
    page,
    limit,
  });
});

exports.notifications = asyncHandler(async (req, res) => {
  const { page, limit, unread } = req.q;
  const filter = {
    user: req.auth.id,
    ...(unread === "true" ? { readAt: null } : {}),
  };
  const [rows, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.auth.id, readAt: null }),
  ]);
  const items = rows.map((n) => ({
    id: String(n._id),
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
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

exports.unreadCount = asyncHandler(async (req, res) =>
  ok(res, "Unread count loaded.", {
    count: await Notification.countDocuments({
      user: req.auth.id,
      readAt: null,
    }),
  }),
);

exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOne({
    _id: req.params.id,
    user: req.auth.id,
  }); // another user's id looks like a missing one
  if (!n) throw new AppError(404, "NOT_FOUND", "Notification not found.");
  if (!n.readAt) {
    n.readAt = new Date();
    await n.save();
  }
  return ok(res, "Marked as read.", { id: String(n._id) });
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

exports.referral = asyncHandler(async (req, res) =>
  ok(res, "Referral loaded.", await referrals.summary(req.auth.id)),
);

exports.applyReferral = asyncHandler(async (req, res) =>
  ok(
    res,
    "Referral code added.",
    await referrals.applyCode(req.auth.id, req.body.code),
  ),
);
