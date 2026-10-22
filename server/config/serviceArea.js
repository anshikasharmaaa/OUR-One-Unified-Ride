"use strict";
// OUR currently serves Indore only. bbox = [minLng, minLat, maxLng, maxLat].
const AREA = {
  name: "Indore",
  center: { lat: 22.7196, lng: 75.8577 },
  bbox: [75.65, 22.45, 76.1, 22.95],
};
const contains = (lat, lng) =>
  lng >= AREA.bbox[0] &&
  lat >= AREA.bbox[1] &&
  lng <= AREA.bbox[2] &&
  lat <= AREA.bbox[3];

module.exports = Object.freeze({ ...AREA, contains });
