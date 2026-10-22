"use strict";
const router = require("express").Router();
const c = require("../controllers/maps.controller");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { geocodeLimiter } = require("../middleware/mapsLimiter");
const S = require("../validators/comparison.schemas");

router.post(
  "/reverse-geocode",
  requireAuth,
  requireRole("USER"),
  geocodeLimiter,
  validate(S.reverseGeocode),
  c.reverseGeocode,
);

module.exports = router;
