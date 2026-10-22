"use strict";
const { FavoriteLocation } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const { MAX_FAVORITES } = require("../config/constants");

// `resolved` = the place has a real location and can be used as a pickup or drop-off.
const view = (f) => ({
  id: String(f._id),
  label: f.label,
  name: f.name || "",
  address: f.address,
  placeId: f.placeId || null,
  lat: f.lat ?? null,
  lng: f.lng ?? null,
  resolved: Boolean(f.placeId && f.lat != null && f.lng != null),
  createdAt: f.createdAt,
  updatedAt: f.updatedAt,
});
const SINGLE = ["HOME", "WORK"];
const labelName = (l) => (l === "HOME" ? "Home" : "Work / College");
const labelTaken = (label) =>
  new AppError(
    409,
    "LABEL_TAKEN",
    `You already have a ${labelName(label)} place saved. Edit it instead.`,
  );
const mineOr404 = async (id, userId) => {
  const f = await FavoriteLocation.findOne({ _id: id, user: userId });
  if (!f)
    throw new AppError(404, "NOT_FOUND", "That saved place was not found.");
  return f;
};
const assertLabelFree = async (userId, label, exceptId) => {
  if (!SINGLE.includes(label)) return;
  const clash = await FavoriteLocation.exists({
    user: userId,
    label,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });
  if (clash) throw labelTaken(label);
};

exports.list = asyncHandler(async (req, res) => {
  const rows = await FavoriteLocation.find({ user: req.auth.id })
    .sort({ createdAt: -1 })
    .lean();
  return ok(res, "Saved places loaded.", {
    items: rows.map(view),
    max: MAX_FAVORITES,
  });
});

exports.create = asyncHandler(async (req, res) => {
  const count = await FavoriteLocation.countDocuments({ user: req.auth.id });
  if (count >= MAX_FAVORITES)
    throw new AppError(
      409,
      "LIMIT_REACHED",
      `You can save up to ${MAX_FAVORITES} places. Remove one to add another.`,
    );
  const { label, name, address, placeId, lat, lng } = req.body;
  await assertLabelFree(req.auth.id, label);
  let doc;
  try {
    doc = await FavoriteLocation.create({
      user: req.auth.id,
      label,
      name,
      address,
      ...(placeId && lat != null ? { placeId, lat, lng } : {}),
    });
  } catch (e) {
    if (e.code === 11000) throw labelTaken(label); // a parallel request saved it first
    throw e;
  }
  return created(res, "Place saved.", view(doc));
});

exports.update = asyncHandler(async (req, res) => {
  const f = await mineOr404(req.params.id, req.auth.id);
  const b = req.body;
  if (b.label && b.label !== f.label)
    await assertLabelFree(req.auth.id, b.label, f._id);
  if (b.label) f.label = b.label;
  if (b.name !== undefined) f.name = b.name;

  const addressChanged = b.address !== undefined && b.address !== f.address;
  if (b.address !== undefined) f.address = b.address;
  if ("placeId" in b || "lat" in b || "lng" in b) {
    // The client sent a (re)resolved location, or explicitly cleared it.
    f.placeId = b.placeId ?? undefined;
    f.lat = b.lat ?? undefined;
    f.lng = b.lng ?? undefined;
  } else if (addressChanged) {
    // The text changed but no new location came with it: the old coordinates would now point at the wrong place.
    f.placeId = undefined;
    f.lat = undefined;
    f.lng = undefined;
  }
  try {
    await f.save();
  } catch (e) {
    if (e.code === 11000) throw labelTaken(f.label);
    throw e;
  }
  return ok(res, "Place updated.", view(f));
});

exports.remove = asyncHandler(async (req, res) => {
  const f = await mineOr404(req.params.id, req.auth.id);
  await f.deleteOne();
  return ok(res, "Place removed.", { id: String(f._id) });
});
