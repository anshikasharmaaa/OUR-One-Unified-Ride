"use strict";
const env = require("../../config/env");
const logger = require("../../utils/logger");
const { loadDemoConfig } = require("../../config/demoRates");
const { createDemoEstimator } = require("./demoEstimates");

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

/**
 * One provider failing or timing out never affects the others. Raw errors are logged without secrets, never returned.
 * `catalog` (optional) lets admins switch providers off and restrict ride categories. Without it nothing is filtered.
 */
function createRegistry({
  providers,
  timeoutMs = 8000,
  log = logger,
  catalog = null,
}) {
  const byId = new Map(providers.map((p) => [p.id, p]));
  const isActive = (cfg, id) => cfg?.[id]?.active !== false;

  async function estimateAll(ctx) {
    const cfg = catalog ? await catalog.getMap() : {};
    const listed = providers.filter((p) => isActive(cfg, p.id)); // a deactivated provider is omitted entirely
    return Promise.all(
      listed.map(async (p) => {
        const allowed = cfg[p.id]?.categories?.length
          ? cfg[p.id].categories
          : null;
        const extra = cfg[p.id]?.logoUrl ? { logoUrl: cfg[p.id].logoUrl } : {};
        try {
          const r = await withTimeout(
            Promise.resolve().then(() => p.estimate(ctx)),
            timeoutMs,
          );
          return {
            id: p.id,
            name: p.name,
            state: r.state,
            estimates: (r.estimates || []).filter(
              (e) => !allowed || allowed.includes(e.vehicleType),
            ),
            message: r.message || "",
            ...extra,
          };
        } catch (err) {
          log.warn(
            {
              provider: p.id,
              code: err.code,
              status: err.status,
              message: err.message,
            },
            "provider estimate failed",
          );
          const message =
            err.code === "TIMEOUT"
              ? `${p.name} took too long to respond.`
              : err.status === 429
                ? `${p.name} is rate limiting requests. Try again shortly.`
                : `${p.name} could not return estimates.`;
          return {
            id: p.id,
            name: p.name,
            state: "error",
            estimates: [],
            message,
            ...extra,
          };
        }
      }),
    );
  }
  return {
    estimateAll,
    describe: () =>
      providers
        .filter((p) => isActive(catalog?.peek?.(), p.id))
        .map((p) => p.describe()),
    get: (id) => byId.get(id),
    deepLink: (id, ctx) =>
      byId.get(id)?.deepLink(ctx) ?? {
        available: false,
        reason: "Unknown provider.",
      },
  };
}

const demo = createDemoEstimator(
  loadDemoConfig(env.rides.demoProvidersJson, (m) => logger.warn(m)),
);
const providers = ["ola", "uber", "rapido"].map((n) =>
  require(`./${n}Provider`)(env.rides, demo),
);
const registry = createRegistry({
  providers,
  timeoutMs: env.rides.providerTimeoutMs,
  catalog: require("../providerCatalog"),
});

module.exports = registry;
module.exports.createRegistry = createRegistry;
