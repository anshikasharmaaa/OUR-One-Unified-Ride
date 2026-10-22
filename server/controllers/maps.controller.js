"use strict";
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/response");
const maps = require("../services/maps");

exports.reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  return ok(res, "Address found.", await maps.reverseGeocode(lat, lng));
});
