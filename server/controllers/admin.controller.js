"use strict";
const {
  User,
  RideSearch,
  RideEvent,
  Booking,
  ContactMessage,
  Provider,
  Referral,
  AuditLog,
} = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/response");
const { ROLES, RIDE_EVENT } = require("../config/constants");
const { verifyPassword } = require("../services/passwords");
const { createSession } = require("../services/sessions");
const { serialize, assertAccountAllowed } = require("../services/accounts");
const rideEvents = require("../services/rideEvents");
const catalog = require("../services/providerCatalog");

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const admin = await User.findOne({ email, role: ROLES.ADMIN }).select(
    "+passwordHash",
  );
  const valid = await verifyPassword(password, admin?.passwordHash);
  if (!admin || !valid)
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Incorrect email or password.",
    );
  assertAccountAllowed(admin);
  const session = await createSession(admin, req, res, { remember: false });
  return ok(res, "Signed in.", session);
});

exports.me = (req, res) =>
  ok(res, "Profile loaded.", { user: serialize(req.account) });

// ---------- Dashboard data (all routes are behind requireAuth + requireRole('ADMIN')) ----------
const DAY = 86400000;
const AUDIT_WINDOW_MS = 10 * 60 * 1000;
const pageOf = (q) => ({
  skip: (q.page - 1) * q.limit,
  limit: q.limit,
  page: q.page,
});
const paged = (items, total, q) => ({
  items,
  total,
  page: q.page,
  limit: q.limit,
});
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Every admin look at a person's data is recorded; the same admin re-opening the same user within 10 minutes is one entry.
const audit = async (req, action, subject) => {
  const recent = await AuditLog.exists({
    actor: req.auth.id,
    action,
    subject,
    createdAt: { $gte: new Date(Date.now() - AUDIT_WINDOW_MS) },
  });
  if (!recent)
    await AuditLog.create({ actor: req.auth.id, action, subject, ip: req.ip });
};
const activeUser = (id) => ({ _id: id, role: ROLES.USER, deletedAt: null }); // deleted accounts are hidden

exports.stats = asyncHandler(async (_req, res) => {
  const d7 = new Date(Date.now() - 7 * DAY);
  const d1 = new Date(Date.now() - DAY);
  const U = { role: ROLES.USER, deletedAt: null };
  const cmp = { type: RIDE_EVENT.COMPARISON_CREATED };
  const [uTotal, uVerified, uWeek, sTotal, sWeek, sDay, cTotal, cWeek, cDay] =
    await Promise.all([
      User.countDocuments(U),
      User.countDocuments({ ...U, emailVerified: true }),
      User.countDocuments({ ...U, createdAt: { $gte: d7 } }),
      RideSearch.countDocuments({}),
      RideSearch.countDocuments({ createdAt: { $gte: d7 } }),
      RideSearch.countDocuments({ createdAt: { $gte: d1 } }),
      RideEvent.countDocuments(cmp),
      RideEvent.countDocuments({ ...cmp, createdAt: { $gte: d7 } }),
      RideEvent.countDocuments({ ...cmp, createdAt: { $gte: d1 } }),
    ]);
  return ok(res, "Stats loaded.", {
    users: { total: uTotal, verified: uVerified, last7Days: uWeek },
    searches: { total: sTotal, last7Days: sWeek, last24Hours: sDay },
    // Real counts of comparisons recorded in ride history. No fares or provider data are counted or implied.
    comparisons: {
      available: true,
      total: cTotal,
      last7Days: cWeek,
      last24Hours: cDay,
    },
  });
});

const userFilter = (q) => {
  const and = [{ role: ROLES.USER }, { deletedAt: null }];
  if (q.verified) and.push({ emailVerified: q.verified === "true" });
  if (q.q) {
    const re = new RegExp(escapeRe(q.q), "i");
    and.push({ $or: [{ name: re }, { email: re }, { phone: re }] });
  }
  return { $and: and };
};

exports.users = asyncHandler(async (req, res) => {
  const { skip, limit } = pageOf(req.q);
  const filter = userFilter(req.q);
  const [rows, total] = await Promise.all([
    User.find(filter)
      .select("+passwordHash")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(), // hash only derives the sign-in label
    User.countDocuments(filter),
  ]);
  const counts = await RideEvent.aggregate([
    { $match: { user: { $in: rows.map((u) => u._id) } } },
    { $group: { _id: "$user", n: { $sum: 1 } } },
  ]);
  const byUser = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  const items = rows.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone || null,
    emailVerified: u.emailVerified,
    status: u.status,
    signInMethods: [
      ...(u.passwordHash ? ["Email"] : []),
      ...(u.googleSubject ? ["Google"] : []),
    ],
    rideEvents: byUser[String(u._id)] || 0,
    createdAt: u.createdAt,
  }));
  return ok(res, "Users loaded.", paged(items, total, req.q));
});

exports.userDetail = asyncHandler(async (req, res) => {
  const u = await User.findOne(activeUser(req.params.id))
    .select("+passwordHash")
    .lean();
  if (!u) throw new AppError(404, "NOT_FOUND", "User not found.");
  const [byType, referred, referrer] = await Promise.all([
    RideEvent.aggregate([
      { $match: { user: u._id } },
      { $group: { _id: "$type", n: { $sum: 1 } } },
    ]),
    Referral.find({ referrer: u._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("referred", "name")
      .lean(),
    u.referredBy
      ? Referral.findOne({ referred: u._id })
          .populate("referrer", "name email")
          .lean()
      : null,
  ]);
  await audit(req, "VIEW_USER", u._id);
  const counts = Object.fromEntries(byType.map((t) => [t._id, t.n]));
  return ok(res, "User loaded.", {
    user: {
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone || null,
      emailVerified: u.emailVerified,
      status: u.status,
      signInMethods: [
        ...(u.passwordHash ? ["Email"] : []),
        ...(u.googleSubject ? ["Google"] : []),
      ],
      referralCode: u.referralCode || null,
      createdAt: u.createdAt,
    },
    counts: {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      byType: counts,
    },
    referral: {
      referredBy: referrer?.referrer
        ? {
            name: referrer.referrer.name,
            email: referrer.referrer.email,
            status: referrer.status,
          }
        : null,
      referred: referred.map((r) => ({
        id: String(r._id),
        name: r.referred?.name || "Deleted user",
        status: r.status,
        createdAt: r.createdAt,
        qualifiedAt: r.qualifiedAt || null,
      })),
    },
  });
});

exports.userRides = asyncHandler(async (req, res) => {
  const exists = await User.exists(activeUser(req.params.id));
  if (!exists) throw new AppError(404, "NOT_FOUND", "User not found.");
  const { skip, limit, page } = pageOf(req.q);
  const filter = {
    user: req.params.id,
    ...(req.q.type ? { type: req.q.type } : {}),
  };
  const [rows, total] = await Promise.all([
    RideEvent.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RideEvent.countDocuments(filter),
  ]);
  await audit(req, "VIEW_USER_RIDES", req.params.id);
  return ok(res, "Ride history loaded.", {
    items: rows.map(rideEvents.view),
    total,
    page,
    limit,
  });
});

exports.searches = asyncHandler(async (req, res) => {
  const { skip, limit } = pageOf(req.q);
  const [rows, total] = await Promise.all([
    RideSearch.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .lean(),
    RideSearch.countDocuments({}),
  ]);
  const items = rows.map((s) => ({
    id: String(s._id),
    pickup: s.pickup,
    dropoff: s.dropoff,
    vehicleType: s.vehicleType,
    status: s.status,
    user: s.user ? { name: s.user.name, email: s.user.email } : null,
    createdAt: s.createdAt,
  }));
  return ok(res, "Searches loaded.", paged(items, total, req.q));
});

// Daily counts, bucketed by India Standard Time (UTC+5:30).
const IST = "Asia/Kolkata";
const IST_MS = 330 * 60000;
const istKey = (d) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 10);
const dayKeys = (days) =>
  Array.from({ length: days }, (_, i) =>
    istKey(new Date(Date.now() - (days - 1 - i) * DAY)),
  );
const sinceOf = (keys) => new Date(Date.parse(`${keys[0]}T00:00:00Z`) - IST_MS);

exports.analytics = asyncHandler(async (req, res) => {
  const { days } = req.q;
  const keys = dayKeys(days);
  const since = sinceOf(keys);
  const bucket = async (Model, filter) => {
    const rows = await Model.find({ ...filter, createdAt: { $gte: since } })
      .select("createdAt")
      .limit(20000)
      .lean();
    const counts = Object.fromEntries(keys.map((k) => [k, 0]));
    rows.forEach((r) => {
      const k = istKey(r.createdAt);
      if (k in counts) counts[k] += 1;
    });
    return keys.map((k) => counts[k]);
  };
  const [users, searches] = await Promise.all([
    bucket(User, { role: ROLES.USER, deletedAt: null }),
    bucket(RideSearch, {}),
  ]);
  return ok(res, "Analytics loaded.", {
    timezone: IST,
    days: keys,
    users,
    searches,
  });
});

// ---------- Overview dashboard: every figure is a database count or aggregation ----------
const pct = (cur, prev) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null; // null = no comparable period, so no % is shown

exports.overview = asyncHandler(async (req, res) => {
  const { days } = req.q;
  const keys = dayKeys(days);
  const since = sinceOf(keys);
  const prevSince = new Date(since.getTime() - days * DAY);
  const U = { role: ROLES.USER, deletedAt: null };
  const cmp = { type: RIDE_EVENT.COMPARISON_CREATED };
  const red = { type: RIDE_EVENT.PROVIDER_OPENED };
  const cur = { createdAt: { $gte: since } };
  const prev = { createdAt: { $gte: prevSince, $lt: since } };

  const trio = async (Model, f) => {
    const [total, inRange, before] = await Promise.all([
      Model.countDocuments(f),
      Model.countDocuments({ ...f, ...cur }),
      Model.countDocuments({ ...f, ...prev }),
    ]);
    return { total, inRange, change: pct(inRange, before) };
  };
  const daily = async (Model, match, field = "createdAt") => {
    const rows = await Model.aggregate([
      { $match: { ...match, [field]: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: `$${field}`,
              timezone: IST,
            },
          },
          n: { $sum: 1 },
        },
      },
    ]);
    const m = Object.fromEntries(rows.map((r) => [r._id, r.n]));
    return keys.map((k) => m[k] || 0);
  };
  await catalog.ensureDefaults();

  const [
    users,
    comparisons,
    redirects,
    queries,
    statusRows,
    provTotal,
    provActive,
    names,
    uS,
    cS,
    rS,
    qIn,
    qDone,
    selections,
    lu,
    lc,
    lr,
    lq,
  ] = await Promise.all([
    trio(User, U),
    trio(RideEvent, cmp),
    trio(RideEvent, red),
    trio(ContactMessage, {}),
    ContactMessage.aggregate([
      { $group: { _id: { $ifNull: ["$status", "OPEN"] }, n: { $sum: 1 } } },
    ]),
    Provider.countDocuments({}),
    Provider.countDocuments({ active: { $ne: false } }),
    catalog.getMap(),
    daily(User, U),
    daily(RideEvent, cmp),
    daily(RideEvent, red),
    daily(ContactMessage, {}),
    daily(ContactMessage, { status: "RESOLVED" }, "resolvedAt"),
    Booking.aggregate([
      { $match: cur },
      { $group: { _id: "$provider", n: { $sum: 1 } } },
      { $sort: { n: -1 } },
    ]),
    User.find(U)
      .sort({ createdAt: -1 })
      .limit(6)
      .select("name createdAt")
      .lean(),
    RideEvent.find(cmp)
      .sort({ createdAt: -1 })
      .limit(6)
      .select("createdAt")
      .lean(),
    RideEvent.find(red)
      .sort({ createdAt: -1 })
      .limit(6)
      .select("createdAt")
      .lean(),
    ContactMessage.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .select("name ticketId createdAt")
      .lean(),
  ]);
  const by = Object.fromEntries(statusRows.map((r) => [r._id, r.n]));

  // Privacy: only registrations and query senders are named; ride activity is shown without identifying anyone.
  const activity = [
    ...lu.map((u) => ({
      id: `u${u._id}`,
      type: "user",
      label: `${u.name} created an account`,
      at: u.createdAt,
    })),
    ...lc.map((e) => ({
      id: `c${e._id}`,
      type: "comparison",
      label: "A rider compared fares",
      at: e.createdAt,
    })),
    ...lr.map((e) => ({
      id: `r${e._id}`,
      type: "redirect",
      label: "A rider opened a provider (not a booking)",
      at: e.createdAt,
    })),
    ...lq.map((q) => ({
      id: `q${q._id}`,
      type: "query",
      label: `${q.name} sent a query${q.ticketId ? ` (${q.ticketId})` : ""}`,
      at: q.createdAt,
    })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 8);

  return ok(res, "Overview loaded.", {
    range: { days, from: keys[0], to: keys[keys.length - 1], timezone: IST },
    totals: {
      users,
      comparisons,
      redirects,
      queries: {
        ...queries,
        open: by.OPEN || 0,
        inProgress: by.IN_PROGRESS || 0,
        resolved: by.RESOLVED || 0,
      },
      providers: { total: provTotal, active: provActive },
    },
    series: {
      days: keys,
      users: uS,
      comparisons: cS,
      redirects: rS,
      queriesReceived: qIn,
      queriesResolved: qDone,
    },
    providerSelections: selections.map((s) => ({
      provider: s._id,
      name: names[s._id]?.name || s._id,
      count: s.n,
    })),
    activity,
  });
});
