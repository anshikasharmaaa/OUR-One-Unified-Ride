"use strict";
const router = require("express").Router();
const c = require("../controllers/comparison.controller");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { compareLimiter } = require("../middleware/mapsLimiter");
const S = require("../validators/comparison.schemas");

router.use(requireAuth, requireRole("USER")); // every comparison route needs a signed-in rider
router.post("/", compareLimiter, validate(S.createComparison), c.create);
router.get("/", validate.query(S.listQuery), c.list);
router.get("/:id", validate.params(S.idParam), c.get);

module.exports = router;
