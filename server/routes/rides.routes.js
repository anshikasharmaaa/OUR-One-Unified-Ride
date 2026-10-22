"use strict";
const router = require("express").Router();
const c = require("../controllers/rides.controller");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  ridesCompareLimiter,
  bookLimiter,
} = require("../middleware/mapsLimiter");
const { providerOpenedLimiter } = require("../middleware/accountLimiters");
const R = require("../validators/rides.schemas");
const S = require("../validators/comparison.schemas");

router.use(requireAuth, requireRole("USER"));
router.get("/providers", c.providers);
router.get(
  "/compare",
  ridesCompareLimiter,
  validate.query(R.compareQuery),
  c.compare,
);
router.post("/book", bookLimiter, validate(R.book), c.book);
router.get("/bookings/:id", validate.params(S.idParam), c.getBooking);
router.post("/bookings/:id/cancel", validate.params(S.idParam), c.cancel);
router.post(
  "/bookings/:id/provider-opened",
  providerOpenedLimiter,
  validate.params(S.idParam),
  c.providerOpened,
);

module.exports = router;
