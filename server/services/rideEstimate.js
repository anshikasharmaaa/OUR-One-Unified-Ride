"use strict";
const { z } = require("zod");
const { PROVIDER_IDS, RIDE_VEHICLES } = require("../config/constants");

const money = z.number().finite().nonnegative();
const estimateSchema = z
  .object({
    provider: z.enum(PROVIDER_IDS),
    vehicleType: z.enum(RIDE_VEHICLES),
    fare: z
      .object({
        min: money,
        max: money,
        currency: z.string().regex(/^[A-Z]{3}$/),
      })
      .refine((f) => f.max >= f.min),
    etaMinutes: z.number().finite().min(0).max(240).nullable(),
    distanceKm: money,
    durationMinutes: money,
    availability: z.object({
      status: z.enum(["available", "unavailable", "unknown"]),
      message: z.string().max(120),
    }),
    source: z.enum(["live", "sandbox", "demo"]),
    isLive: z.boolean(),
    updatedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    bookingMode: z.enum(["demo", "provider"]),
  })
  .strict()
  // A fare can only be flagged live if it really came from the live source.
  .refine((e) => e.isLive === (e.source === "live"), {
    message: "isLive must match source",
  });

/** Returns the validated estimate, or null for missing/partial/invalid provider data. */
function normalizeEstimate(raw) {
  const r = estimateSchema.safeParse(raw);
  return r.success ? r.data : null;
}
module.exports = { normalizeEstimate };
