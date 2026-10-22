"use strict";
const env = require("../config/env");
const logger = require("../utils/logger");
const { loadFareConfig, buildOptions } = require("./fareOptions");

/**
 * Authorised provider integrations plug in here. Each adapter is:
 *   async ({ route, pickup, dropoff }) => Option[]   // fares/ETAs exactly as the provider's API returned them
 * keyed by provider name ('Ola' | 'Uber' | 'Rapido'). None are shipped: those APIs need provider-approved credentials.
 * Until one is registered the card says "not connected" and no price is shown.
 */
const adapters = {};

async function runAdapters(ctx) {
  const live = {};
  await Promise.all(
    Object.entries(adapters).map(async ([name, fn]) => {
      try {
        live[name] = await fn(ctx);
      } catch {
        live[name] = { error: true };
      }
    }),
  );
  return live;
}

const config = loadFareConfig(env.fares, (m) => logger.warn(m));

async function optionsFor(ctx) {
  const live = await runAdapters(ctx);
  return buildOptions({ route: ctx.route, config, live });
}

module.exports = { optionsFor, adapters };
