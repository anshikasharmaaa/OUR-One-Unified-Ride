"use strict";
const { createProvider, liveNotImplemented } = require("./providerBase");
const { olaWebLink } = require("./deepLinks");

// To go live: implement fetchLive using https://developers.olacabs.com/docs/ride-estimate with rides.credentials.ola,
// return { state: 'live' | 'sandbox', estimates: [...] } and let rideEstimate.js validate it.
module.exports = (rides, demo) =>
  createProvider({
    id: "ola",
    name: "Ola",
    enabled: rides.enabled.ola,
    dataMode: rides.dataMode,
    demo,
    fetchLive: liveNotImplemented("Ola"),
    deepLink: ({ pickup, dropoff }) =>
      olaWebLink({ xappToken: rides.olaXappToken, pickup, dropoff }),
  });
