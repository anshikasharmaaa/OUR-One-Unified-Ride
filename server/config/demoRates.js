"use strict";
/**
 * ILLUSTRATIVE demo rate cards. These are NOT real Ola/Uber/Rapido tariffs. They only exist so the demo has
 * plausible numbers, and every estimate built from them is labelled "Demo estimate".
 * `categories` is what the demo pretends each provider offers; it is configuration, not a claim about any city.
 */
const CATEGORIES = ["BIKE", "AUTO", "ECONOMY_CAB", "PREMIUM_CAB"];
const BASE_RATES = {
  BIKE: { base: 15, perKm: 5.5, perMin: 0.4, minFare: 25, maxMultiplier: 1.2 },
  AUTO: { base: 25, perKm: 11, perMin: 0.8, minFare: 40, maxMultiplier: 1.25 },
  ECONOMY_CAB: {
    base: 45,
    perKm: 13,
    perMin: 1.2,
    minFare: 90,
    maxMultiplier: 1.3,
  },
  PREMIUM_CAB: {
    base: 70,
    perKm: 18,
    perMin: 1.6,
    minFare: 140,
    maxMultiplier: 1.3,
  },
};
const PROVIDERS = {
  ola: {
    scale: 1.0,
    categories: ["BIKE", "AUTO", "ECONOMY_CAB", "PREMIUM_CAB"],
    etaRange: [3, 9],
  },
  uber: {
    scale: 1.07,
    categories: ["AUTO", "ECONOMY_CAB", "PREMIUM_CAB"],
    etaRange: [4, 10],
  },
  rapido: {
    scale: 0.92,
    categories: ["BIKE", "AUTO", "ECONOMY_CAB"],
    etaRange: [2, 8],
  },
};

/** Optional override via DEMO_PROVIDERS_JSON: {"ola":{"scale":1.1,"categories":["AUTO"],"etaRange":[4,8]}} */
function loadDemoConfig(json, warn = () => {}) {
  const cfg = { rates: BASE_RATES, providers: structuredClone(PROVIDERS) };
  if (!json) return cfg;
  let o;
  try {
    o = JSON.parse(json);
  } catch {
    warn("DEMO_PROVIDERS_JSON is not valid JSON and was ignored.");
    return cfg;
  }
  for (const [id, v] of Object.entries(o || {})) {
    const t = cfg.providers[id];
    if (!t || !v || typeof v !== "object") continue;
    if (typeof v.scale === "number" && v.scale >= 0.5 && v.scale <= 3)
      t.scale = v.scale;
    if (Array.isArray(v.categories))
      t.categories = v.categories.filter((c) => CATEGORIES.includes(c));
    const r = v.etaRange;
    if (
      Array.isArray(r) &&
      r.length === 2 &&
      r.every((n) => Number.isInteger(n) && n >= 1 && n <= 60) &&
      r[0] <= r[1]
    )
      t.etaRange = r;
  }
  return cfg;
}
module.exports = { loadDemoConfig, CATEGORIES };
