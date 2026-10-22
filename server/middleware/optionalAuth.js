'use strict';
const { Session } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../services/tokens');

// Attaches req.auth when a valid token + live session is present; otherwise the request simply stays anonymous.
module.exports = asyncHandler(async (req, _res, next) => {
  const match = /^Bearer (.+)$/i.exec(req.get('authorization') || '');
  if (match) {
    try {
      const claims = verifyAccessToken(match[1]);
      const live = await Session.exists({ family: String(claims.fam), revokedAt: null, expiresAt: { $gt: new Date() } });
      if (live) req.auth = { id: claims.sub, role: claims.role };
    } catch { /* invalid/expired token => treat as anonymous */ }
  }
  next();
});
