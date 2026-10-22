"use strict";
/**
 * Builds the ride-option cards for a computed route.
 * Rule: a price appears ONLY if (a) an authorised provider adapter returned it, (b) the owner configured a
 * rate card for a local provider, or (c) the owner turned on clearly-labelled test estimates. Otherwise the card
 * says the provider is not connected. Nothing here invents a fare, ETA or availability.
 */
const CATEGORY_LABEL = {
  BIKE: "Bike",
  AUTO: "Auto",
  ECONOMY_CAB: "Economy cab",
  PREMIUM_CAB: "Premium cab",
};
const MAJOR_PROVIDERS = ["Ola", "Uber", "Rapido"];

const isNum = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function normaliseRate(r) {
  if (!r || !isNum(r.base) || !isNum(r.perKm) || !isNum(r.perMin)) return null;
  const mult =
    typeof r.maxMultiplier === "number" &&
    r.maxMultiplier >= 1 &&
    r.maxMultiplier <= 5
      ? r.maxMultiplier
      : 1;
  return {
    base: r.base,
    perKm: r.perKm,
    perMin: r.perMin,
    minFare: isNum(r.minFare) ? r.minFare : 0,
    maxMultiplier: mult,
  };
}
function parseRates(obj) {
  const out = {};
  if (!obj || typeof obj !== "object") return out;
  for (const [cat, r] of Object.entries(obj)) {
    if (!CATEGORY_LABEL[cat]) continue;
    const n = normaliseRate(r);
    if (n) out[cat] = n;
  }
  return out;
}
function computeFare(rate, route, currency) {
  const raw = Math.max(
    rate.minFare,
    rate.base +
      rate.perKm * (route.distanceMeters / 1000) +
      rate.perMin * (route.durationSeconds / 60),
  );
  const min = Math.round(raw);
  return {
    min,
    max: Math.max(min, Math.round(raw * rate.maxMultiplier)),
    currency,
  };
}
function parseJson(text, label, warn) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    warn(`${label} is not valid JSON and was ignored.`);
    return null;
  }
}

/** Turns the raw env strings into a validated config once, at startup. */
function loadFareConfig(
  { estimatesEnabled, fareModelJson, localProvidersJson },
  warn = () => {},
) {
  const model = parseJson(fareModelJson, "FARE_MODEL_JSON", warn);
  const currency =
    model &&
    typeof model.currency === "string" &&
    /^[A-Z]{3}$/.test(model.currency)
      ? model.currency
      : "INR";
  const estimateRates =
    estimatesEnabled && model ? parseRates(model.rates) : {};
  if (estimatesEnabled && !Object.keys(estimateRates).length)
    warn(
      "FARE_ESTIMATES_ENABLED=true but FARE_MODEL_JSON has no valid rates; test estimates are off.",
    );
  const locals = parseJson(localProvidersJson, "LOCAL_PROVIDERS_JSON", warn);
  const localProviders = (Array.isArray(locals) ? locals : [])
    .filter((p) => p && typeof p.name === "string" && p.name.trim())
    .slice(0, 10)
    .map((p) => ({
      name: p.name.trim().slice(0, 60),
      rates: parseRates(p.rates),
    }))
    .filter((p) => Object.keys(p.rates).length > 0);
  return { currency, estimateRates, localProviders };
}

const baseOption = (o) => ({
  id: `${slug(o.provider)}-${(o.category || "all").toLowerCase()}`,
  provider: o.provider,
  providerType: o.providerType,
  category: o.category || null,
  categoryLabel: o.category ? CATEGORY_LABEL[o.category] : "All ride types",
  fare: o.fare || null,
  etaMinutes: isNum(o.etaMinutes) ? o.etaMinutes : null,
  tripDurationSeconds: o.fare ? o.tripDurationSeconds : null,
  availability: o.availability || "UNKNOWN", // AVAILABLE | UNAVAILABLE | UNKNOWN
  source: o.source, // PROVIDER_API | LOCAL_RATE_CARD | OUR_ESTIMATE_TEST | NONE
  note: o.note || "",
});

/**
 * @param route  { distanceMeters, durationSeconds }
 * @param config result of loadFareConfig
 * @param live   { [providerName]: Option[] | { error: true } } results from authorised provider adapters
 */
function buildOptions({ route, config, live = {} }) {
  const options = [];

  for (const name of MAJOR_PROVIDERS) {
    const result = live[name];
    if (Array.isArray(result) && result.length) {
      result.forEach((o) =>
        options.push(
          baseOption({
            ...o,
            provider: name,
            providerType: "MAJOR",
            source: "PROVIDER_API",
            tripDurationSeconds: o.tripDurationSeconds ?? route.durationSeconds,
          }),
        ),
      );
    } else if (result && result.error) {
      options.push(
        baseOption({
          provider: name,
          providerType: "MAJOR",
          source: "NONE",
          note: `${name} did not respond just now. Try again in a moment — no price is shown rather than a guess.`,
        }),
      );
    } else {
      options.push(
        baseOption({
          provider: name,
          providerType: "MAJOR",
          source: "NONE",
          note: `Live ${name} fares aren’t connected yet (needs an authorised ${name} API). OUR never shows made-up prices.`,
        }),
      );
    }
  }

  for (const p of config.localProviders) {
    for (const [cat, rate] of Object.entries(p.rates)) {
      options.push(
        baseOption({
          provider: p.name,
          providerType: "LOCAL",
          category: cat,
          fare: computeFare(rate, route, config.currency),
          tripDurationSeconds: route.durationSeconds,
          source: "LOCAL_RATE_CARD",
          note: "Estimated from this provider’s configured rate card and the real route. The provider sets the final fare.",
        }),
      );
    }
  }

  for (const [cat, rate] of Object.entries(config.estimateRates)) {
    options.push(
      baseOption({
        provider: "OUR estimate",
        providerType: "ESTIMATE",
        category: cat,
        fare: computeFare(rate, route, config.currency),
        tripDurationSeconds: route.durationSeconds,
        source: "OUR_ESTIMATE_TEST",
        note: "TEST estimate from configured rates and the real route distance/time. Not a live provider price.",
      }),
    );
  }
  return options;
}

module.exports = {
  CATEGORY_LABEL,
  MAJOR_PROVIDERS,
  loadFareConfig,
  buildOptions,
  computeFare,
  parseRates,
};
