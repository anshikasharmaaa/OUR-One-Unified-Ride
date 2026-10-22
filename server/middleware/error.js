'use strict';
const env = require('../config/env');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const notFound = (_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route not found.'));

const errorHandler = (err, req, res, _next)  => {
  let e = err;
  if (err?.code === 11000) e = new AppError(409, 'DUPLICATE', 'That record already exists.');
  else if (err?.type === 'entity.parse.failed') e = new AppError(400, 'BAD_JSON', 'Request body is not valid JSON.');
  else if (err?.type === 'entity.too.large') e = new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large.');
  else if (err?.name === 'ValidationError' || err?.name === 'CastError') e = new AppError(400, 'VALIDATION_ERROR', 'Invalid input.');

  if (!(e instanceof AppError)) {
    logger.error({ err: { name: err?.name, message: err?.message, stack: env.isProd ? undefined : err?.stack }, path: req.path }, 'Unhandled error');
    e = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.');
  }
  const body = { success: false, message: e.message, code: e.code, errors: e.errors || [] };
  if (e.status === 429) res.set('Retry-After', '60');
  return res.status(e.status).json(body);
};

module.exports = { notFound, errorHandler };
