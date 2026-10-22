// Recommendation + sorting rules. Eligible = numeric fare, not UNAVAILABLE, not expired, comparable currency.
const isNum = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const mid = (o) => (o.fare.min + o.fare.max) / 2;

/** Documented scoring rule for "Best value": fare counts 70%, pickup time 30%. */
export const VALUE_WEIGHTS = Object.freeze({ fare: 0.7, eta: 0.3 });
export const isExpired = (o, now = Date.now()) =>
  !!o?.expiresAt && Date.parse(o.expiresAt) <= now;

export function eligibleOptions(options = [], now = Date.now()) {
  const priced = options.filter(
    (o) =>
      o &&
      o.fare &&
      isNum(o.fare.min) &&
      isNum(o.fare.max) &&
      o.availability?.status !== "unavailable" &&
      !isExpired(o, now),
  );
  const counts = {};
  priced.forEach((o) => {
    counts[o.fare.currency] = (counts[o.fare.currency] || 0) + 1;
  });
  const currency = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]; // only compare fares in one currency
  return priced.filter((o) => o.fare.currency === currency);
}

const minBy = (list, score) =>
  list.reduce(
    (best, o) => (best === null || score(o) < score(best) ? o : best),
    null,
  );

/** Lowest weighted score of min-max normalised fare and ETA (0 = best). Needs >= 2 options with a valid ETA, else null. */
function bestValue(list) {
  const withEta = list.filter((o) => isNum(o.etaMinutes));
  if (withEta.length < 2) return null;
  const fares = withEta.map(mid);
  const etas = withEta.map((o) => o.etaMinutes);
  const norm = (v, lo, hi) => (hi === lo ? 0 : (v - lo) / (hi - lo));
  const [fLo, fHi, eLo, eHi] = [
    Math.min(...fares),
    Math.max(...fares),
    Math.min(...etas),
    Math.max(...etas),
  ];
  return minBy(
    withEta,
    (o) =>
      VALUE_WEIGHTS.fare * norm(mid(o), fLo, fHi) +
      VALUE_WEIGHTS.eta * norm(o.etaMinutes, eLo, eHi),
  );
}

export function getRecommendations(options = [], now = Date.now()) {
  const list = eligibleOptions(options, now);
  const cheapest = minBy(list, (o) => mid(o) * 1e6 + o.fare.min); // tie-break: lower minimum fare
  const fastest = minBy(
    list.filter((o) => isNum(o.etaMinutes)),
    (o) => o.etaMinutes,
  );
  const value = bestValue(list);
  return {
    cheapestId: cheapest?.id ?? null,
    fastestId: fastest?.id ?? null,
    bestValueId: value?.id ?? null,
    isDemo: list.some((o) => o.source === "demo"), // UI labels recommendations "Demo result"
  };
}

const SOURCE_RANK = { live: 0, sandbox: 1, demo: 2 };
const rank = (o) => (o.fare ? (SOURCE_RANK[o.source] ?? 2) : 3);
const noEta = (o) => !isNum(o.etaMinutes);

const SORTERS = {
  recommended: (a, b, rec) =>
    (b.id === rec.bestValueId) - (a.id === rec.bestValueId) ||
    rank(a) - rank(b) ||
    mid(a) - mid(b),
  lowestFare: (a, b) => mid(a) - mid(b),
  fastestPickup: (a, b) =>
    noEta(a) - noEta(b) || a.etaMinutes - b.etaMinutes || mid(a) - mid(b),
};
export const SORT_MODES = [
  { id: "recommended", label: "Recommended" },
  { id: "lowestFare", label: "Lowest fare" },
  { id: "fastestPickup", label: "Fastest pickup" },
];
export function sortOptions(
  options = [],
  mode = "recommended",
  now = Date.now(),
) {
  const rec = getRecommendations(options, now);
  const fn = SORTERS[mode] || SORTERS.recommended;
  // Expired options always go last; everything else follows the chosen rule.
  return [...options].sort(
    (a, b) => isExpired(a, now) - isExpired(b, now) || fn(a, b, rec),
  );
}
