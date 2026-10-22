"use strict";
const OLA_WEB = "https://book.olacabs.com/"; // documented web deep link (India only)

const validPoint = (p) =>
  p &&
  Number.isFinite(p.lat) &&
  Number.isFinite(p.lng) &&
  typeof p.address === "string";

function olaWebLink({ xappToken, pickup, dropoff }) {
  if (!xappToken)
    return {
      available: false,
      reason:
        "Ola's official link needs the XAPP token Ola issues to partners. Set OLA_XAPP_TOKEN to enable it.",
    };
  if (!validPoint(pickup) || !validPoint(dropoff))
    return {
      available: false,
      reason: "Pickup or drop-off is missing, so the link can't be created.",
    };
  const u = new URL(OLA_WEB);
  u.searchParams.set("utm_source", xappToken);
  u.searchParams.set("lat", String(pickup.lat));
  u.searchParams.set("lng", String(pickup.lng));
  u.searchParams.set("drop_lat", String(dropoff.lat));
  u.searchParams.set("drop_lng", String(dropoff.lng));
  u.searchParams.set("pickup_name", pickup.address.slice(0, 200));
  u.searchParams.set("drop_name", dropoff.address.slice(0, 200));
  u.searchParams.set("dsw", "yes");
  return {
    available: true,
    url: u.toString(),
    host: u.host,
    note: "This opens Ola's website with your pickup and drop-off. Ola applies the ride category only in its app, so choose it there.",
  };
}
const uberLink = () => ({
  available: false,
  reason:
    "Uber's Guest Rides API is not a rider deep link, and no permitted consumer link has been verified for OUR yet.",
});
const rapidoLink = () => ({
  available: false,
  reason:
    "No official Rapido deep link or partner integration has been verified, so this provider is not configured.",
});
module.exports = { olaWebLink, uberLink, rapidoLink };
