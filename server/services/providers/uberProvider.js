"use strict";
const { createProvider, liveNotImplemented } = require("./providerBase");
const { uberLink } = require("./deepLinks");

// Before going live: confirm Uber permits OUR's multi-provider comparison use, then follow the Guest Rides auth docs.
// Sandbox responses must be returned with state 'sandbox', never 'live'.
module.exports = (rides, demo) =>
  createProvider({
    id: "uber",
    name: "Uber",
    enabled: rides.enabled.uber,
    dataMode: rides.dataMode,
    demo,
    fetchLive: liveNotImplemented("Uber"),
    deepLink: uberLink,
  });
