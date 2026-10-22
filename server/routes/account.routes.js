"use strict";
const express = require("express");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const L = require("../middleware/rateLimit");
const A = require("../validators/account.schemas");
const { idParam } = require("../validators/comparison.schemas");
const acc = require("../controllers/account.controller");
const act = require("../controllers/activity.controller");

const router = express.Router();
router.use(requireAuth, requireRole("USER")); // every route is private and scoped to the signed-in user

router.get("/profile", acc.getProfile);
router.patch("/profile", validate(A.updateProfile), acc.updateProfile);

// Raw image bytes (the global JSON parser ignores these content types). POST avoids a CORS change for PUT.
router.post(
  "/avatar",
  express.raw({
    type: ["image/jpeg", "image/png", "image/webp"],
    limit: "150kb",
  }),
  acc.putAvatar,
);
router.get("/avatar", acc.getAvatar);
router.delete("/avatar", acc.deleteAvatar);

router.post(
  "/password",
  L.loginLimiter,
  validate(A.changePassword),
  acc.changePassword,
);
router.post(
  "/delete",
  L.loginLimiter,
  validate(A.deleteAccount),
  acc.deleteAccount,
);

router.get("/rides", validate.query(A.ridesQuery), act.rides);
router.get(
  "/notifications",
  validate.query(A.notificationsQuery),
  act.notifications,
);
router.post("/notifications/read-all", act.readAll);
router.post("/notifications/:id/read", validate.params(idParam), act.markRead);
router.get("/referral", act.referral);
router.post("/referral/claim", validate(A.claimReferral), act.claimReferral);
router.post("/reports", validate(A.report), act.report);

module.exports = router;
