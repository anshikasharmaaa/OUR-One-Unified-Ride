'use strict';
const pino = require('pino');
const env = require('../config/env');

module.exports = pino({
  level: env.isTest ? 'silent' : env.isProd ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.code',
      '*.credential',
      '*.resetToken',
      '*.accessToken',
    ],
    censor: '[redacted]',
  },
});
