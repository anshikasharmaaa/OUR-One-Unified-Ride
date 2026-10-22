'use strict';
const env = require('../config/env');
const { Otp } = require('../models');
const AppError = require('../utils/AppError');
const { hmac, randomOtp, safeEqualHex } = require('../utils/crypto');
const { OTP_TTL_SECONDS, OTP_MAX_ATTEMPTS, OTP_RESEND_COOLDOWN_SECONDS } = require('../config/constants');
const { sendOtpEmail } = require('./email');
const logger = require('../utils/logger');

// HMAC with a server-side secret: a leaked database alone cannot be used to brute-force the 6-digit space.
const digest = (email, purpose, code) => hmac(env.otpSecret, `${purpose}:${email}:${code}`);
const INVALID = () => new AppError(400, 'INVALID_OTP', 'That code is invalid or has expired. Request a new code.');

/**
 * Create a fresh code (replacing any earlier one) and email it.
 * Returns { sent:false } when inside the resend cooldown. Throws 503 if email cannot be delivered.
 */
async function sendOtp({ email, purpose, name }) {
  const latest = await Otp.findOne({ email, purpose, consumed: false }).sort({ createdAt: -1 });
  if (latest && Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) return { sent: false };

  await Otp.deleteMany({ email, purpose }); // invalidate earlier codes
  const code = randomOtp();
  const doc = await Otp.create({
    email,
    purpose,
    codeHash: digest(email, purpose, code),
    expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
  });
  try {
    await sendOtpEmail({ to: email, name, code, purpose, expiresInMinutes: OTP_TTL_SECONDS / 60 });
  } catch (err) {
    await Otp.deleteOne({ _id: doc._id }); // don't leave a code nobody received (and don't start a cooldown)
    logger.error({ code: err.code, status: err.status }, 'OTP email delivery failed');
    throw err instanceof AppError ? err : new AppError(503, 'EMAIL_FAILED', 'We could not send the email right now. Please try again shortly.');
  }
  return { sent: true };
}

/** Check a code. Single use, purpose-bound, attempt-limited, and expiry is re-checked here (TTL index is only cleanup). */
async function verifyOtp({ email, purpose, code }) {
  const otp = await Otp.findOne({ email, purpose, consumed: false }).sort({ createdAt: -1 });
  if (!otp) throw INVALID();
  if (otp.expiresAt.getTime() <= Date.now()) {
    await Otp.deleteOne({ _id: otp._id });
    throw INVALID();
  }
  // Count the attempt atomically *before* comparing, so parallel guesses cannot exceed the limit.
  const counted = await Otp.findOneAndUpdate(
    { _id: otp._id, consumed: false, attempts: { $lt: OTP_MAX_ATTEMPTS } },
    { $inc: { attempts: 1 } },
    { new: true },
  );
  if (!counted) throw INVALID();
  if (!safeEqualHex(counted.codeHash, digest(email, purpose, code))) throw INVALID();

  const consumed = await Otp.findOneAndUpdate({ _id: otp._id, consumed: false }, { $set: { consumed: true } });
  if (!consumed) throw INVALID();
  await Otp.deleteMany({ email, purpose });
}

module.exports = { sendOtp, verifyOtp };
