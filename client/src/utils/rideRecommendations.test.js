import { describe, expect, test } from "vitest";
import {
  getRecommendations,
  sortOptions,
  eligibleOptions,
} from "./rideRecommendations";

const future = new Date(Date.now() + 600000).toISOString();
const opt = (id, min, max, eta, extra = {}) => ({
  id,
  fare: { min, max, currency: "INR" },
  etaMinutes: eta,
  availability: { status: "unknown" },
  source: "demo",
  expiresAt: future,
  ...extra,
});

describe("recommendations", () => {
  const list = [
    opt("a", 100, 120, 8),
    opt("b", 80, 100, 9),
    opt("c", 130, 150, 2),
  ];
  test("cheapest and fastest", () => {
    const r = getRecommendations(list);
    expect(r.cheapestId).toBe("b");
    expect(r.fastestId).toBe("c");
    expect(r.isDemo).toBe(true);
  });
  test("best value picks a real option when 2+ ETAs exist", () =>
    expect(getRecommendations(list).bestValueId).toBeTruthy());
  test("best value is null without enough ETAs", () =>
    expect(
      getRecommendations([opt("a", 1, 2, null), opt("b", 3, 4, 5)]).bestValueId,
    ).toBeNull());
  test("unavailable, unpriced and expired never win", () => {
    const bad = [
      opt("u", 1, 1, 1, { availability: { status: "unavailable" } }),
      {
        id: "n",
        fare: null,
        etaMinutes: 1,
        availability: { status: "unknown" },
      },
      opt("e", 1, 1, 1, {
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
      opt("ok", 50, 60, 5),
    ];
    expect(eligibleOptions(bad).map((o) => o.id)).toEqual(["ok"]);
    expect(getRecommendations(bad).cheapestId).toBe("ok");
  });
  test("mixed currencies are not compared", () => {
    const mixed = [
      opt("inr1", 100, 100, 3),
      opt("inr2", 90, 90, 4),
      { ...opt("usd", 1, 1, 1), fare: { min: 1, max: 1, currency: "USD" } },
    ];
    expect(getRecommendations(mixed).cheapestId).toBe("inr2");
  });
  test("empty input yields no winners", () =>
    expect(getRecommendations([])).toMatchObject({
      cheapestId: null,
      fastestId: null,
      bestValueId: null,
    }));
});

describe("sorting", () => {
  const list = [
    opt("a", 100, 120, 8),
    opt("b", 80, 100, null),
    opt("c", 130, 150, 2),
  ];
  test("lowest fare", () =>
    expect(sortOptions(list, "lowestFare").map((o) => o.id)).toEqual([
      "b",
      "a",
      "c",
    ]));
  test("fastest pickup puts missing ETAs last", () =>
    expect(sortOptions(list, "fastestPickup").map((o) => o.id)).toEqual([
      "c",
      "a",
      "b",
    ]));
  test("expired options go last", () => {
    const withExpired = [
      opt("x", 1, 1, 1, {
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
      opt("y", 500, 500, 9),
    ];
    expect(sortOptions(withExpired, "lowestFare")[0].id).toBe("y");
  });
});
