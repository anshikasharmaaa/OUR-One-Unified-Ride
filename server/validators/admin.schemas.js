"use strict";
const { z } = require("zod");
const { RIDE_VEHICLES } = require("../config/constants");

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
const search = z.string().trim().max(80).optional();
const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.")
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Invalid date.");

exports.usersQuery = pageQuery.extend({
  q: search,
  verified: z.enum(["true", "false"]).optional(),
});
exports.contactsQuery = pageQuery.extend({
  q: search,
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]).optional(),
  from: day.optional(),
  to: day.optional(),
});
// RESOLVED is deliberately absent: a query becomes resolved only through a successfully sent reply.
exports.contactStatusBody = z
  .object({ status: z.enum(["OPEN", "IN_PROGRESS"]) })
  .strict();
exports.contactReplyBody = z
  .object({
    message: z
      .string()
      .trim()
      .min(5, "Write at least a few words.")
      .max(5000, "Keep the reply under 5000 characters."),
    requestId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, "Invalid request id."),
  })
  .strict();
exports.overviewQuery = z.object({
  days: z.coerce
    .number()
    .int()
    .refine((d) => [7, 14, 30].includes(d), "Use 7, 14 or 30.")
    .default(14),
});

/* ---- providers ---- */
const isHttps = (v) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
};
const isAssetPath = (v) =>
  /^\/assets\/[A-Za-z0-9_\-./]+$/.test(v) && !v.includes("..");
const nullable = (s) =>
  z.preprocess((v) => (v === "" ? null : v), s.nullable().optional());

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z][a-z0-9-]{1,29}$/,
    "Use 2–30 letters, numbers or hyphens, starting with a letter.",
  );
const name = z.string().trim().min(2, "Enter the provider name.").max(60);
const logoUrl = nullable(
  z
    .string()
    .trim()
    .max(300)
    .refine(
      (v) => isHttps(v) || isAssetPath(v),
      "Use an https:// URL or a /assets/… path.",
    ),
);
const websiteUrl = nullable(
  z.string().trim().max(300).refine(isHttps, "Enter a valid https:// URL."),
);
const categories = z
  .array(z.enum(RIDE_VEHICLES))
  .max(4)
  .transform((a) => [...new Set(a)]);

exports.createProvider = z
  .object({
    slug,
    name,
    logoUrl,
    websiteUrl,
    categories: categories.default([]),
    active: z.boolean().default(true),
  })
  .strict();
exports.updateProvider = z
  .object({ name, logoUrl, websiteUrl, categories, active: z.boolean() })
  .partial()
  .strict()
  .refine((o) => Object.keys(o).length > 0, "Nothing to update.");
