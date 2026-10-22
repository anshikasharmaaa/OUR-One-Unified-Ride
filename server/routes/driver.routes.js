'use strict';
const router = require('express').Router();
const c = require('../controllers/driver.controller');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const L = require('../middleware/rateLimit');
const S = require('../validators/schemas');

router.post('/register', L.otpSendLimiter, validate(S.registerDriver), c.register);
router.post('/verify-email', L.otpVerifyLimiter, validate(S.verifyOtp), c.verifyEmail);
router.post('/resend-verification', L.otpSendLimiter, validate(S.emailOnly), c.resendVerification);
router.post('/login', L.loginLimiter, validate(S.loginUser), c.login);
router.get('/me', requireAuth, requireRole('DRIVER'), c.me);

module.exports = router;
