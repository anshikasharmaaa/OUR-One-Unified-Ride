"use strict";
const { createProvider, liveNotImplemented } = require("./providerBase");
const { rapidoLink } = require("./deepLinks");

// No official public Rapido API has been verified. Enable only with approved partner access.
module.exports = (rides, demo) =>
  createProvider({
    id: "rapido",
    name: "Rapido",
    enabled: rides.enabled.rapido,
    dataMode: rides.dataMode,
    demo,
    fetchLive: liveNotImplemented("Rapido"),
    deepLink: rapidoLink,
  });
