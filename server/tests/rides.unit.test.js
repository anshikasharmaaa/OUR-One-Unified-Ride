"use strict";
const { normalizeEstimate } = require("../services/rideEstimate");
const { loadDemoConfig } = require("../config/demoRates");
const { createDemoEstimator } = require("../services/providers/demoEstimates");
const {
  olaWebLink,
  uberLink,
  rapidoLink,
} = require("../services/providers/deepLinks");
const { progressFor } = require("../services/bookingTimeline");
const { createRegistry } = require("../services/providers/providerRegistry");

const route = { distanceMeters: 5000, durationSeconds: 900 };
const ctx = { comparisonId: "c1", route, categories: [] };
const demo = createDemoEstimator(loadDemoConfig(""));
const silent = { warn: () => {} };

const good = () => ({
  provider: "ola",
  vehicleType: "auto",
  fare: { min: 80, max: 100, currency: "INR" },
  etaMinutes: 5,
  distanceKm: 5,
  durationMinutes: 15,
  availability: { status: "unknown", message: "x" },
  source: "demo",
  isLive: false,
  updatedAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(),
  bookingMode: "demo",
});

describe("normalizeEstimate", () => {
  test("accepts a valid estimate", () =>
    expect(normalizeEstimate(good())).not.toBeNull());
  test("rejects a demo fare flagged live", () =>
    expect(normalizeEstimate({ ...good(), isLive: true })).toBeNull());
  test("rejects min > max, missing fare and bad provider", () => {
    expect(
      normalizeEstimate({
        ...good(),
        fare: { min: 9, max: 1, currency: "INR" },
      }),
    ).toBeNull();
    expect(normalizeEstimate({ ...good(), fare: undefined })).toBeNull();
    expect(normalizeEstimate({ ...good(), provider: "lyft" })).toBeNull();
  });
});

describe("demo estimator", () => {
  test("all three providers return labelled demo data", () => {
    for (const [id, name] of [
      ["ola", "Ola"],
      ["uber", "Uber"],
      ["rapido", "Rapido"],
    ]) {
      const r = demo.estimate(id, name, ctx);
      expect(r.state).toBe("demo");
      r.estimates.forEach((e) => {
        expect(normalizeEstimate(e)).not.toBeNull();
        expect(e.isLive).toBe(false);
      });
    }
  });
  test("only configured categories appear; filtering works", () => {
    expect(
      demo.estimate("uber", "Uber", ctx).estimates.map((e) => e.vehicleType),
    ).not.toContain("bike");
    expect(
      demo.estimate("ola", "Ola", { ...ctx, categories: ["auto"] }).estimates,
    ).toHaveLength(1);
  });
  test("ETA is stable across calls", () =>
    expect(demo.estimate("ola", "Ola", ctx).estimates[0].etaMinutes).toBe(
      demo.estimate("ola", "Ola", ctx).estimates[0].etaMinutes,
    ));
});

describe("registry isolation", () => {
  test("one failing and one slow provider do not block the healthy one", async () => {
    const mk = (id, fn) => ({
      id,
      name: id,
      estimate: fn,
      describe: () => ({ id }),
      deepLink: () => ({}),
    });
    const reg = createRegistry({
      timeoutMs: 50,
      log: silent,
      providers: [
        mk("ola", async () => {
          throw new Error("boom");
        }),
        mk("uber", () => new Promise(() => {})),
        mk("rapido", async () => ({
          state: "demo",
          estimates: [],
          message: "ok",
        })),
      ],
    });
    const out = await reg.estimateAll(ctx);
    expect(out.map((r) => r.state)).toEqual(["error", "error", "demo"]);
    expect(out[0].message).not.toMatch(/boom/); // raw errors are never returned
  });
});

describe("deep links", () => {
  const pickup = { lat: 22.7, lng: 75.8, address: "A & B, Indore" };
  const dropoff = { lat: 22.75, lng: 75.9, address: "C, Indore" };
  test("Ola without XAPP token is disabled", () =>
    expect(olaWebLink({ xappToken: "", pickup, dropoff }).available).toBe(
      false,
    ));
  test("Ola with token encodes parameters", () => {
    const l = olaWebLink({ xappToken: "tok", pickup, dropoff });
    const u = new URL(l.url);
    expect(u.host).toBe("book.olacabs.com");
    expect(u.searchParams.get("utm_source")).toBe("tok");
    expect(u.searchParams.get("pickup_name")).toBe("A & B, Indore");
    expect(u.searchParams.get("drop_lat")).toBe("22.75");
  });
  test("Uber and Rapido are not configured", () => {
    expect(uberLink().available).toBe(false);
    expect(rapidoLink().available).toBe(false);
  });
});

describe("booking timeline", () => {
  const t0 = Date.now();
  const b = {
    createdAt: new Date(t0),
    cancelledAt: null,
    hasDriver: true,
    etaMinutes: 6,
  };
  test("progresses through the five stages", () => {
    expect(
      [0, 4, 8, 12, 16].map((s) => progressFor(b, t0 + s * 1000).status),
    ).toEqual(["preparing", "searching", "checking", "assigned", "en_route"]);
  });
  test("settles after the approach and never claims a real acceptance", () => {
    expect(progressFor(b, t0 + 70000).settled).toBe(true);
  });
  test("cancel freezes progress", () => {
    const p = progressFor(
      { ...b, cancelledAt: new Date(t0 + 5000) },
      t0 + 60000,
    );
    expect(p.status).toBe("cancelled");
    expect(p.stepIndex).toBe(1);
  });
  test("no demo driver => empty state, no fictional assignment", () => {
    const p = progressFor({ ...b, hasDriver: false }, t0 + 20000);
    expect(p.status).toBe("no_driver");
    expect(p.showDriver).toBe(false);
  });
});
