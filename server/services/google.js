'use strict';
const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');
const AppError = require('../utils/AppError');

let client;
const isGoogleConfigured = () => Boolean(env.googleClientId);

/**
 * Verifies signature, issuer, audience and expiry (done by google-auth-library against Google's public keys),
 * then insists on a verified email. Returns only the claims we need.
 */
async function verifyGoogleIdToken(idToken) {
  if (!isGoogleConfigured()) throw new AppError(503, 'GOOGLE_NOT_CONFIGURED', 'Google sign-in is temporarily unavailable.');
  client = client || new OAuth2Client(env.googleClientId);
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientId });
    payload = ticket.getPayload();
  } catch {
    throw new AppError(401, 'INVALID_GOOGLE_TOKEN', 'Google sign-in failed. Please try again.');
  }
  if (!payload || !payload.sub || !payload.email) throw new AppError(401, 'INVALID_GOOGLE_TOKEN', 'Google sign-in failed. Please try again.');
  if (payload.email_verified !== true) throw new AppError(401, 'GOOGLE_EMAIL_UNVERIFIED', 'Your Google email address is not verified.');
  return { sub: payload.sub, email: String(payload.email).toLowerCase(), name: payload.name || '' };
}

module.exports = { verifyGoogleIdToken, isGoogleConfigured };
