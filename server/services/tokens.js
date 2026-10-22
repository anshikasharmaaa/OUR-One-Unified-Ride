'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { RESET_TOKEN_TTL_SECONDS } = require('../config/constants');
const AppError = require('../utils/AppError');

const ISSUER = 'our-api';
const base = { algorithm: 'HS256', issuer: ISSUER };

const signAccessToken = ({ sub, role, fam }) =>
  jwt.sign({ role, fam }, env.accessTokenSecret, { ...base, subject: sub, audience: 'access', expiresIn: env.accessTokenTtlSeconds });

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.accessTokenSecret, { algorithms: ['HS256'], issuer: ISSUER, audience: 'access' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new AppError(401, 'TOKEN_EXPIRED', 'Your session has expired. Please sign in again.');
    throw new AppError(401, 'INVALID_TOKEN', 'Authentication is invalid. Please sign in again.');
  }
}

// Reset token: separate audience so it can never be used as an access token (and vice versa).
// `pwv` is bound to the current password hash, so it stops working the moment the password changes.
const signResetToken = ({ sub, pwv }) =>
  jwt.sign({ pwv }, env.accessTokenSecret, { ...base, subject: sub, audience: 'pwd-reset', expiresIn: RESET_TOKEN_TTL_SECONDS });

function verifyResetToken(token) {
  try {
    return jwt.verify(token, env.accessTokenSecret, { algorithms: ['HS256'], issuer: ISSUER, audience: 'pwd-reset' });
  } catch {
    throw new AppError(400, 'INVALID_RESET_TOKEN', 'This reset link has expired. Start again from "Forgot password".');
  }
}

module.exports = { signAccessToken, verifyAccessToken, signResetToken, verifyResetToken };
