"use strict";
const express = require("express");
const router = express.Router();
const me = require("../controllers/me.controller");
const fav = require("../controllers/favorites.controller");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const L = require("../middleware/accountLimiters");
const A = require("../validators/account.schemas");
const { idParam } = require("../validators/comparison.schemas");

// Raw image bytes. The global JSON parser ignores these content types; the size cap is enforced here.
const rawImage = express.raw({
  type: ["image/jpeg", "image/png", "image/webp"],
  limit: "150kb",
});

// Every route here acts on the signed-in user only: the id always comes from the verified token, never from the request.
router.use(requireAuth, requireRole("USER"));

router.get("/", me.get);
router.patch("/", L.profileLimiter, validate(A.updateProfile), me.update);
router.delete("/", L.deleteLimiter, validate(A.deleteAccount), me.remove);
router.post(
  "/password",
  L.passwordLimiter,
  validate(A.changePassword),
  me.changePassword,
);

router.post("/avatar", L.avatarLimiter, rawImage, me.putAvatar);
router.get("/avatar", me.getAvatar);
router.delete("/avatar", L.avatarLimiter, me.deleteAvatar);

router.get("/rides", validate.query(A.rideListQuery), me.rides); // read-only: there is deliberately no way to edit or delete history

router.get(
  "/notifications",
  validate.query(A.notificationQuery),
  me.notifications,
);
router.get("/notifications/unread-count", me.unreadCount);
router.post("/notifications/read-all", me.readAll);
router.post("/notifications/:id/read", validate.params(idParam), me.markRead);

router.get("/referral", me.referral);
router.post(
  "/referral/apply",
  L.referralLimiter,
  validate(A.applyReferral),
  me.applyReferral,
);

router.get("/favorites", fav.list);
router.post(
  "/favorites",
  L.favoritesLimiter,
  validate(A.favoriteCreate),
  fav.create,
);
router.patch(
  "/favorites/:id",
  L.favoritesLimiter,
  validate.params(idParam),
  validate(A.favoriteUpdate),
  fav.update,
);
router.delete(
  "/favorites/:id",
  L.favoritesLimiter,
  validate.params(idParam),
  fav.remove,
);

module.exports = router;
