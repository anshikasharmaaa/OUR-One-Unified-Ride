'use strict';
const env = require('../config/env');
const { Session } = require('../models');
const AppError = require('../utils/AppError');
const { hmac, randomToken, uuid } = require('../utils/crypto');
const { REFRESH_COOKIE, SESSION_TTL_SECONDS, REFRESH_RACE_GRACE_SECONDS } = require('../config/constants');
const { signAccessToken } = require('./tokens');
const { principalTypeFor, loadPrincipal, assertAccountAllowed, serialize } = require('./accounts');

const hashToken = (raw) => hmac(env.refreshTokenSecret, raw);

const cookieBase = () => ({
  httpOnly: true,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  domain: env.cookie.domain,
  path: '/api/auth', // sent only to refresh/logout
});
const setRefreshCookie = (res, raw, remember, expiresAt) =>
  res.cookie(REFRESH_COOKIE, raw, { ...cookieBase(), ...(remember ? { expires: expiresAt } : {}) }); // no expiry => session cookie
const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, cookieBase());

const clientMeta = (req) => ({ ip: req.ip, userAgent: (req.get('user-agent') || '').slice(0, 300) });

/** Start a brand-new login session (new family). */
async function createSession(account, req, res, { remember = false } = {}) {
  const ttl = SESSION_TTL_SECONDS[account.role][remember ? 'remember' : 'short'];
  const raw = randomToken();
  const session = await Session.create({
    principalType: principalTypeFor(account.role),
    principalId: account._id,
    family: uuid(),
    tokenHash: hashToken(raw),
    remember,
    expiresAt: new Date(Date.now() + ttl * 1000),
    ...clientMeta(req),
  });
  setRefreshCookie(res, raw, remember, session.expiresAt);
  const accessToken = signAccessToken({ sub: String(account._id), role: account.role, fam: session.family });
  return { accessToken, user: serialize(account) };
}

/** Exchange a refresh token for a new access token + a rotated refresh token. */
async function rotateSession(raw, req, res) {
  if (!raw || typeof raw !== 'string') throw new AppError(401, 'NO_REFRESH_TOKEN', 'Please sign in.');
  const current = await Session.findOne({ tokenHash: hashToken(raw) });
  if (!current) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Please sign in again.');

  if (current.revokedAt) {
    // Already rotated or revoked. A reuse outside the grace window means the token may be stolen.
    const recentlyRotated = current.rotatedAt && Date.now() - current.rotatedAt.getTime() < REFRESH_RACE_GRACE_SECONDS * 1000;
    if (recentlyRotated) throw new AppError(401, 'REFRESH_RACE', 'Session refresh is in progress. Retry shortly.');
    await Session.updateMany({ family: current.family, revokedAt: null }, { $set: { revokedAt: new Date() } });
    throw new AppError(401, 'REFRESH_REUSED', 'Your session is no longer valid. Please sign in again.');
  }
  if (current.expiresAt <= new Date()) throw new AppError(401, 'SESSION_EXPIRED', 'Your session has expired. Please sign in again.');

  const account = await loadPrincipal(current.principalType, current.principalId);
  try {
    if (!account) throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Please sign in again.');
    assertAccountAllowed(account);
  } catch (err) {
    await Session.updateMany({ family: current.family, revokedAt: null }, { $set: { revokedAt: new Date() } });
    throw err;
  }

  const now = new Date();
  const claimed = await Session.findOneAndUpdate({ _id: current._id, revokedAt: null }, { $set: { revokedAt: now, rotatedAt: now } });
  if (!claimed) throw new AppError(401, 'REFRESH_RACE', 'Session refresh is in progress. Retry shortly.');

  const newRaw = randomToken();
  const next = await Session.create({
    principalType: current.principalType,
    principalId: current.principalId,
    family: current.family,
    tokenHash: hashToken(newRaw),
    remember: current.remember,
    expiresAt: current.expiresAt, // absolute lifetime from original login
    ...clientMeta(req),
  });
  await Session.updateOne({ _id: current._id }, { $set: { replacedBy: next._id } });
  setRefreshCookie(res, newRaw, current.remember, next.expiresAt);

  const accessToken = signAccessToken({ sub: String(account._id), role: account.role, fam: next.family });
  return { accessToken, user: serialize(account) };
}

/** Revoke the whole login chain that this refresh token belongs to. */
async function revokeByRefreshToken(raw) {
  if (!raw || typeof raw !== 'string') return;
  const s = await Session.findOne({ tokenHash: hashToken(raw) });
  if (s) await Session.updateMany({ family: s.family, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

const revokeAllForAccount = (account) =>
  Session.updateMany(
    { principalType: principalTypeFor(account.role), principalId: account._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

module.exports = { createSession, rotateSession, revokeByRefreshToken, revokeAllForAccount, clearRefreshCookie };
