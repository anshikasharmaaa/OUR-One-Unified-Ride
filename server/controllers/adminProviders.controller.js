"use strict";
const { Provider } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const registry = require("../services/providers/providerRegistry");
const catalog = require("../services/providerCatalog");

// Honest status: "API enabled" is a configuration flag, not proof of a working live integration.
function integrationOf(reg) {
  if (!reg)
    return {
      label: "Listing only",
      tone: "neutral",
      note: "No fare integration exists for this provider. It is not shown on the comparison page.",
    };
  const { mode } = reg.describe();
  if (mode === "api")
    return {
      label: "API enabled",
      tone: "warn",
      note: "Enabled by configuration. Live fares are not verified.",
    };
  if (mode === "demo")
    return {
      label: "Sample rates",
      tone: "neutral",
      note: "Estimates come from sample rate cards, not from the provider.",
    };
  return {
    label: "Not available",
    tone: "bad",
    note: "The integration is off in the current data mode.",
  };
}
const view = (d) => {
  const reg = registry.get(d.slug);
  return {
    id: String(d._id),
    slug: d.slug,
    name: d.name,
    logoUrl: d.logoUrl || null,
    websiteUrl: d.websiteUrl || null,
    categories: d.categories || [],
    defaultCategories: reg ? reg.describe().categories : [],
    active: d.active !== false,
    builtIn: Boolean(reg),
    integration: integrationOf(reg),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
};
const done = () => catalog.invalidate();

exports.list = asyncHandler(async (_req, res) => {
  await catalog.ensureDefaults();
  const docs = await Provider.find({})
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  return ok(res, "Providers loaded.", {
    items: docs.map(view),
    total: docs.length,
  });
});

exports.create = asyncHandler(async (req, res) => {
  try {
    const doc = await Provider.create({ ...req.body, sortOrder: 100 }); // body is whitelisted by the schema
    done();
    return created(res, "Provider added.", { provider: view(doc.toObject()) });
  } catch (err) {
    if (err?.code === 11000)
      throw new AppError(
        409,
        "DUPLICATE_PROVIDER",
        "A provider with this identifier already exists.",
        [{ field: "slug", message: "This identifier is already in use." }],
      );
    throw err;
  }
});

exports.update = asyncHandler(async (req, res) => {
  const doc = await Provider.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  ).lean();
  if (!doc) throw new AppError(404, "NOT_FOUND", "Provider not found.");
  done();
  return ok(res, "Provider updated.", { provider: view(doc) });
});

exports.remove = asyncHandler(async (req, res) => {
  const doc = await Provider.findById(req.params.id).lean();
  if (!doc) throw new AppError(404, "NOT_FOUND", "Provider not found.");
  if (registry.get(doc.slug))
    throw new AppError(
      409,
      "BUILT_IN_PROVIDER",
      "Built-in comparison providers can be deactivated but not deleted.",
    );
  await Provider.deleteOne({ _id: doc._id });
  done();
  return ok(res, "Provider removed.", {});
});
