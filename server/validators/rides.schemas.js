"use strict";
const { z } = require("zod");
const { PROVIDER_IDS, RIDE_VEHICLES } = require("../config/constants");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

// ?comparisonId=...&categories=auto,bike   (categories optional; empty = all)
exports.compareQuery = z.object({
  comparisonId: objectId,
  categories: z
    .string()
    .max(100)
    .optional()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(z.array(z.enum(RIDE_VEHICLES)).max(4)),
});

exports.book = z
  .object({
    comparisonId: objectId,
    provider: z.enum(PROVIDER_IDS),
    vehicleType: z.enum(RIDE_VEHICLES),
  })
  .strict();
