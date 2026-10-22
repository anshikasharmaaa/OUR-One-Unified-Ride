"use strict";
const Provider = require("../models/Provider");
const logger = require("../utils/logger");

const DEFAULTS = [
  { slug: "rapido", name: "Rapido", sortOrder: 1 },
  { slug: "ola", name: "Ola", sortOrder: 2 },
  { slug: "uber", name: "Uber", sortOrder: 3 },
];
const TTL_MS = 15000;
let cache = { at: 0, map: null };
let seeded = false;

/** Idempotent. Creates the three comparison providers once and never overwrites an admin's edits. */
async function ensureDefaults() {
  if (seeded) return;
  await Promise.all(
    DEFAULTS.map(({ slug, ...rest }) =>
      Provider.updateOne(
        { slug },
        { $setOnInsert: { ...rest, categories: [], active: true } },
        { upsert: true },
      ),
    ),
  );
  seeded = true;
}

/** { [slug]: providerDoc }. Short cache; if the database hiccups the last known copy (or "everything active") is used. */
async function getMap() {
  if (cache.map && Date.now() - cache.at < TTL_MS) return cache.map;
  try {
    await ensureDefaults();
    const docs = await Provider.find({}).lean();
    cache = {
      at: Date.now(),
      map: Object.fromEntries(docs.map((d) => [d.slug, d])),
    };
  } catch (err) {
    logger.warn(
      { message: err.message },
      "provider catalog unavailable; using last known settings",
    );
    return cache.map || {};
  }
  return cache.map;
}

const peek = () => cache.map;
const invalidate = () => {
  cache = { at: 0, map: null };
};

module.exports = { ensureDefaults, getMap, peek, invalidate, DEFAULTS };
