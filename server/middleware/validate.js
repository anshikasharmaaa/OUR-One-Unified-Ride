'use strict';
const AppError = require('../utils/AppError');

module.exports = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.') || 'body', message: i.message }));
    return next(new AppError(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', errors));
  }
  req.body = result.data; // only whitelisted, typed fields survive (mass-assignment protection)
  return next();
};

// Validates req.query; the parsed (typed, defaulted) values are placed on req.q.
module.exports.query = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.') || 'query', message: i.message }));
    return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters.', errors));
  }
  req.q = result.data;
  return next();
};

// Validates req.params (e.g. a Mongo id) so malformed ids never reach the database layer.
module.exports.params = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.params ?? {});
  if (!result.success) return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid identifier.'));
  return next();
};
