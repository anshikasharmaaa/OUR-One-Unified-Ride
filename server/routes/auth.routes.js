'use strict';
const router = require('express').Router();
const c = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const originGuard = require('../middleware/originGuard');
const { requireAuth, requireRole } = require('../middleware/auth');
const L = require('../middleware/rateLimit');
const S = require('../validators/schemas');

router.post('/register', L.otpSendLimiter, validate(S.registerUser), c.register);
router.post('/verify-email', L.otpVerifyLimiter, validate(S.verifyOtp), c.verifyEmail);
router.post('/resend-verification', L.otpSendLimiter, validate(S.emailOnly), c.resendVerification);
router.post('/login', L.loginLimiter, validate(S.loginUser), c.login);
router.post('/google', L.googleLimiter, validate(S.googleLogin), c.google);
router.post('/forgot-password', L.otpSendLimiter, validate(S.emailOnly), c.forgotPassword);
router.post('/verify-reset-otp', L.otpVerifyLimiter, validate(S.verifyOtp), c.verifyResetOtp);
router.post('/reset-password', L.resetLimiter, validate(S.resetPassword), c.resetPassword);
router.post('/refresh', originGuard, L.refreshLimiter, c.refresh);
router.post('/logout', originGuard, c.logout);
router.get('/me', requireAuth, requireRole('USER'), c.me);

module.exports = router;
