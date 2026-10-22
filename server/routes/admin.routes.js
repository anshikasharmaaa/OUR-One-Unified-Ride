"use strict";
const router = require("express").Router();
const c = require("../controllers/admin.controller");
const contacts = require("../controllers/adminContacts.controller");
const providers = require("../controllers/adminProviders.controller");
const validate = require("../middleware/validate");
const { requireAuth, requireRole } = require("../middleware/auth");
const L = require("../middleware/rateLimit");
const { replyLimiter } = require("../middleware/contactLimiter");
const S = require("../validators/schemas");
const A = require("../validators/account.schemas");
const V = require("../validators/admin.schemas");
const { idParam } = require("../validators/comparison.schemas");

router.post("/login", L.adminLoginLimiter, validate(S.loginAdmin), c.login);
router.get("/me", requireAuth, requireRole("ADMIN"), c.me);

// Authentication and the ADMIN role are enforced on the server for every route below.
const guard = [requireAuth, requireRole("ADMIN"), L.adminReadLimiter];

router.get("/overview", ...guard, validate.query(V.overviewQuery), c.overview);
router.get("/stats", ...guard, c.stats);
router.get("/users", ...guard, validate.query(V.usersQuery), c.users);
router.get("/users/:id", ...guard, validate.params(idParam), c.userDetail);
router.get(
  "/users/:id/rides",
  ...guard,
  validate.params(idParam),
  validate.query(A.rideListQuery),
  c.userRides,
);
router.get("/searches", ...guard, validate.query(S.pageQuery), c.searches);
router.get(
  "/analytics",
  ...guard,
  validate.query(S.analyticsQuery),
  c.analytics,
);

router.get("/contacts/counts", ...guard, contacts.counts);
router.get(
  "/contacts",
  ...guard,
  validate.query(V.contactsQuery),
  contacts.list,
);
router.get("/contacts/:id", ...guard, validate.params(idParam), contacts.get);
router.patch(
  "/contacts/:id/status",
  ...guard,
  validate.params(idParam),
  validate(V.contactStatusBody),
  contacts.setStatus,
);
router.post(
  "/contacts/:id/reply",
  ...guard,
  replyLimiter,
  validate.params(idParam),
  validate(V.contactReplyBody),
  contacts.reply,
);

router.get("/providers", ...guard, providers.list);
router.post(
  "/providers",
  ...guard,
  validate(V.createProvider),
  providers.create,
);
router.patch(
  "/providers/:id",
  ...guard,
  validate.params(idParam),
  validate(V.updateProvider),
  providers.update,
);
router.delete(
  "/providers/:id",
  ...guard,
  validate.params(idParam),
  providers.remove,
);

module.exports = router;
