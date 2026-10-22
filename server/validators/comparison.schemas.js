"use strict";
const { z } = require("zod");
const { SEARCH_VEHICLES } = require("../config/constants");

const place = z.object({
  placeId: z.string().trim().min(1).max(300),
  address: z.string().trim().min(3).max(300),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

exports.createComparison = z
  .object({
    pickup: place,
    dropoff: place,
    vehicleType: z.enum(SEARCH_VEHICLES).default("ANY"),
  })
  .strict()
  .refine((v) => v.pickup.placeId !== v.dropoff.placeId, {
    message: "Pickup and drop must be different places.",
    path: ["dropoff"],
  });

exports.reverseGeocode = z
  .object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
  })
  .strict();

exports.idParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
});

exports.listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
