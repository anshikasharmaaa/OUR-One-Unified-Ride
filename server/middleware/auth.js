'use strict';
const { Session } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../services/tokens');
const { loadPrincipal, assertAccountAllowed } = require('../services/accounts');

/**
 * Identity comes only from a verified access token + live server-side state:
 * the session family must still be active and the account must currently be allowed in.
 * Nothing about identity or role is ever read from the request body, query or localStorage.
 */
const requireAuth = asyncHandler(async (req, _res, next) => {
  const match = /^Bearer (.+)$/i.exec(req.get('authorization') || '');
  if (!match) throw new AppError(401, 'NO_TOKEN', 'Please sign in to continue.');
  const claims = verifyAccessToken(match[1]);

  const session = await Session.findOne({ family: String(claims.fam), revokedAt: null, expiresAt: { $gt: new Date() } });
  if (!session || String(session.principalId) !== claims.sub) {
    throw new AppError(401, 'SESSION_REVOKED', 'Your session has ended. Please sign in again.');
  }
  const account = await loadPrincipal(session.principalType, session.principalId);
  if (!account || account.role !== claims.role) throw new AppError(401, 'INVALID_TOKEN', 'Authentication is invalid. Please sign in again.');
  assertAccountAllowed(account);

  req.auth = { id: String(account._id), role: account.role, family: session.family };
  req.account = account;
  next();
});

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.auth || !roles.includes(req.auth.role)) {
    return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource.'));
  }
  return next();
};

module.exports = { requireAuth, requireRole };
