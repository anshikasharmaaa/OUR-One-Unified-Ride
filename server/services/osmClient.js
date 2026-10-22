"use strict";
const AppError = require("../utils/AppError");
const area = require("../config/serviceArea");

const OUT_OF_AREA = `OUR currently works in ${area.name} only. Please choose places within ${area.name}.`;

/**
 * Route: OSRM (OpenStreetMap road network). Reverse geocode: Nominatim. No API keys.
 * `fetchImpl` is injectable so error handling can be tested without the network.
 */
function createMapsClient({
  routingUrl,
  reverseUrl,
  userAgent,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000,
  log = () => {},
}) {
  const requireFetch = () => {
    if (typeof fetchImpl !== "function")
      throw new AppError(
        503,
        "MAPS_NOT_CONFIGURED",
        "This server needs Node 18+ to call the map services.",
      );
  };

  const call = async (url) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetchImpl(url, {
        method: "GET",
        signal: ctrl.signal,
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
          "Accept-Language": "en",
        },
      });
    } catch (err) {
      throw new AppError(
        502,
        "MAPS_UNREACHABLE",
        err?.name === "AbortError"
          ? "The map service took too long to respond. Please try again."
          : "We could not reach the map service. Please try again.",
      );
    } finally {
      clearTimeout(timer);
    }
  };

  const httpFailure = (status, what) => {
    if (status === 429)
      return new AppError(
        503,
        "MAPS_QUOTA",
        "The map service is busy right now. Please try again in a minute.",
      );
    log({ status, what }, "map service request failed");
    return new AppError(
      502,
      "MAPS_UNAVAILABLE",
      "The map service is unavailable right now. Please try again later.",
    );
  };

  async function computeRoute(origin, destination) {
    requireFetch();
    if (
      !area.contains(origin.lat, origin.lng) ||
      !area.contains(destination.lat, destination.lng)
    )
      throw new AppError(422, "OUT_OF_AREA", OUT_OF_AREA);

    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `${routingUrl}/route/v1/driving/${coords}?overview=full&geometries=polyline&alternatives=false&steps=false`;
    const res = await call(url);
    // OSRM answers 400 with { code: "NoSegment" | "NoRoute" } for unroutable input, so read the body before judging the status.
    const data = await res.json().catch(() => ({}));

    if (data.code === "NoRoute" || data.code === "NoSegment")
      throw new AppError(
        422,
        "NO_ROUTE",
        "We could not find a drivable road route between those two places. Try different locations.",
      );
    if (!res.ok) throw httpFailure(res.status, "route");

    const route = data?.routes?.[0];
    if (
      data.code !== "Ok" ||
      !route?.geometry ||
      !Number.isFinite(route.duration) ||
      !Number.isFinite(route.distance)
    ) {
      log({ code: data.code }, "osrm returned an unusable route");
      throw new AppError(
        502,
        "MAPS_UNAVAILABLE",
        "The route service returned an incomplete route. Please try again.",
      );
    }

    // Each point is snapped to the nearest road; if that road is far away the point is probably not reachable by road.
    const far = (data.waypoints || []).some((w) => Number(w.distance) > 500);
    if (far)
      throw new AppError(
        422,
        "INVALID_LOCATION",
        "One of those places is not near a drivable road. Pick a point closer to a road.",
      );

    return {
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      encodedPolyline: route.geometry, // precision-5 encoded polyline, decoded in the browser
    };
  }

  const COARSE = new Set([
    "city",
    "town",
    "village",
    "municipality",
    "state_district",
    "county",
    "state",
    "country",
    "postcode",
  ]);

  const nominatim = async (lat, lng, zoom, layer) => {
    const qs = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
      zoom: String(zoom),
      addressdetails: "1",
      "accept-language": "en",
    });
    if (layer) qs.set("layer", layer);
    const res = await call(`${reverseUrl}/reverse?${qs}`);
    if (!res.ok) throw httpFailure(res.status, "reverse");
    return res.json().catch(() => ({}));
  };

  const label = (a = {}, name = "") => {
    const parts = [
      name,
      [a.house_number, a.road].filter(Boolean).join(" "),
      a.neighbourhood,
      a.suburb || a.city_district,
      a.city || a.town || a.village,
      a.state,
      a.postcode,
    ];
    return parts
      .filter((v, i) => v && parts.indexOf(v) === i)
      .join(", ")
      .slice(0, 300);
  };

  async function reverseGeocode(lat, lng) {
    requireFetch();
    if (!area.contains(lat, lng))
      throw new AppError(
        422,
        "OUT_OF_AREA",
        `Your location is outside ${area.name}. OUR currently works in ${area.name} only, so please enter your pickup manually.`,
      );
    const placeId = `gps:${lat.toFixed(5)},${lng.toFixed(5)}`;

    // 1) Exact: only real addresses, places and roads. The layer filter keeps city/district boundaries ("Indore City") out.
    const exact = await nominatim(lat, lng, 18, "address,poi");
    if (
      !exact.error &&
      exact.display_name &&
      (exact.address?.road || exact.name)
    ) {
      const poi =
        exact.name && exact.name !== exact.address?.road ? exact.name : "";
      return {
        placeId,
        address: label(exact.address, poi),
        lat,
        lng,
        precision: "exact",
      };
    }

    // 2) Area level (suburb / neighbourhood). The client will not use this as a pickup point, only as a starting search.
    const zone = await nominatim(lat, lng, 14);
    if (!zone.error && zone.display_name && !COARSE.has(zone.addresstype)) {
      return {
        placeId,
        address: label(zone.address, zone.name),
        lat,
        lng,
        precision: "area",
      };
    }

    throw new AppError(
      404,
      "NO_ADDRESS",
      "We could not find an address for your current location.",
    );
  }

  return { computeRoute, reverseGeocode };
}

module.exports = { createMapsClient };
