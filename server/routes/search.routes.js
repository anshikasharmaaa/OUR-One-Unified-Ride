'use strict';
const router = require('express').Router();
const c = require('../controllers/search.controller');
const validate = require('../middleware/validate');
const optionalAuth = require('../middleware/optionalAuth');
const { searchLimiter } = require('../middleware/rateLimit');
const { requireAuth, requireRole } = require('../middleware/auth');
const S = require('../validators/schemas');

router.get('/mine', requireAuth, requireRole('USER'), validate.query(S.pageQuery), c.mine);
router.post('/', searchLimiter, optionalAuth, validate(S.createSearch), c.create);
module.exports = router;
