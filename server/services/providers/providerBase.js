"use strict";
/**
 * A provider adapter:
 *   estimate(ctx) -> { state: 'live'|'sandbox'|'demo'|'unavailable'|'error', estimates: RawEstimate[], message }
 * Rules: if the provider's API flag is on, ONLY the live adapter is used (no silent demo fallback).
 * If it is off, demo data is used in RIDE_DATA_MODE=demo and the provider is "unavailable" in live mode.
 */
function createProvider({
  id,
  name,
  enabled,
  dataMode,
  demo,
  fetchLive,
  deepLink,
}) {
  async function estimate(ctx) {
    if (enabled) return fetchLive(ctx);
    if (dataMode === "demo") return demo.estimate(id, name, ctx);
    return {
      state: "unavailable",
      estimates: [],
      message: `${name} integration is not enabled.`,
    };
  }
  const describe = () => ({
    id,
    name,
    apiEnabled: enabled,
    mode: enabled ? "api" : dataMode === "demo" ? "demo" : "unavailable",
    categories: demo.categoriesFor(id).map((c) => c.toLowerCase()),
  });
  return { id, name, estimate, describe, deepLink };
}

// The live estimate calls are NOT implemented: no official endpoint or auth flow has been verified for this build.
const liveNotImplemented = (name) => async () => ({
  state: "unavailable",
  estimates: [],
  message: `${name} is enabled, but its live estimate call has not been implemented yet.`,
});
module.exports = { createProvider, liveNotImplemented };
