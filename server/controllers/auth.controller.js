"use strict";
const { User, Otp } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ok, created } = require("../utils/response");
const logger = require("../utils/logger");
const {
  ROLES,
  OTP_PURPOSE,
  OTP_TTL_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
  REFRESH_COOKIE,
  USER_STATUS,
  APPROVAL,
} = require("../config/constants");
const {
  hashPassword,
  verifyPassword,
  passwordVersion,
} = require("../services/passwords");
const { sendOtp, verifyOtp } = require("../services/otp");
const {
  createSession,
  rotateSession,
  revokeByRefreshToken,
  revokeAllForAccount,
  clearRefreshCookie,
} = require("../services/sessions");
const { serialize, assertAccountAllowed } = require("../services/accounts");
const { signResetToken, verifyResetToken } = require("../services/tokens");
const { verifyGoogleIdToken } = require("../services/google");
const referrals = require("../services/referrals");

const otpInfo = (email) => ({
  email,
  otpExpiresInSeconds: OTP_TTL_SECONDS,
  resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
});
const BAD_LOGIN = () =>
  new AppError(401, "INVALID_CREDENTIALS", "Incorrect email or password.");
const BAD_REFERRAL = () =>
  new AppError(
    400,
    "INVALID_REFERRAL_CODE",
    "That referral code isn’t valid.",
    [{ field: "referralCode", message: "That referral code isn’t valid." }],
  );

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, referralCode } = req.body;

  // A typo in a referral code is reported now, while the person can still fix it.
  let referrer = null;
  if (referralCode) {
    referrer = await referrals.findReferrer(referralCode);
    if (!referrer) throw BAD_REFERRAL();
  }

  let user = await User.findOne({ email }).select("+passwordHash");
  if (user && (user.role !== ROLES.USER || user.emailVerified)) {
    throw new AppError(
      409,
      "EMAIL_EXISTS",
      "An account with this email already exists. Try logging in instead.",
    );
  }
  if (referrer && user && String(user._id) === String(referrer._id)) {
    throw new AppError(
      400,
      "SELF_REFERRAL",
      "You can’t use your own referral code.",
    );
  }

  const passwordHash = await hashPassword(password);
  if (user) {
    // An earlier, never-verified sign-up for this address: the newest attempt replaces it.
    user.name = name;
    user.passwordHash = passwordHash;
    user.referredBy = referrer ? referrer._id : undefined;
    await user.save();
  } else {
    // role / emailVerified / status are never read from the request.
    // referredBy only remembers WHO referred; the Referral record is created once the email is verified.
    user = await User.create({
      name,
      email,
      passwordHash,
      role: ROLES.USER,
      emailVerified: false,
      approvalStatus: APPROVAL.APPROVED,
      ...(referrer ? { referredBy: referrer._id } : {}),
    });
  }
  await sendOtp({ email, purpose: OTP_PURPOSE.USER_VERIFY, name });
  return created(
    res,
    "Account created. Enter the 6-digit code we emailed you.",
    otpInfo(email),
  );
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  await verifyOtp({ email, purpose: OTP_PURPOSE.USER_VERIFY, code });
  const user = await User.findOneAndUpdate(
    { email, role: ROLES.USER },
    { $set: { emailVerified: true } },
    { new: true },
  );
  if (!user)
    throw new AppError(
      400,
      "INVALID_OTP",
      "That code is invalid or has expired. Request a new code.",
    );
  // Best effort: a referral problem must never block email verification.
  await referrals
    .createFromSignup(user._id)
    .catch((e) =>
      logger.warn({ message: e.message }, "referral from signup failed"),
    );
  return ok(res, "Email verified. You can now log in.");
});

exports.resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({
    email,
    role: ROLES.USER,
    emailVerified: false,
  });
  if (user) {
    // Not awaited: identical response and timing whether or not the account exists.
    sendOtp({ email, purpose: OTP_PURPOSE.USER_VERIFY, name: user.name }).catch(
      (e) => logger.warn({ code: e.code }, "resend verification failed"),
    );
  }
  return ok(
    res,
    "If this email is waiting for verification, a new code is on its way.",
    {
      resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
      otpExpiresInSeconds: OTP_TTL_SECONDS,
    },
  );
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  const user = await User.findOne({ email }).select("+passwordHash");
  const valid = await verifyPassword(password, user?.passwordHash);
  if (!user || user.role !== ROLES.USER || !valid) throw BAD_LOGIN();
  assertAccountAllowed(user); // EMAIL_NOT_VERIFIED / ACCOUNT_SUSPENDED (only reachable with the right password)
  const session = await createSession(user, req, res, {
    remember: Boolean(rememberMe),
  });
  return ok(res, "Signed in.", session);
});

exports.google = asyncHandler(async (req, res) => {
  const g = await verifyGoogleIdToken(req.body.credential);
  let user = await User.findOne({ googleSubject: g.sub }).select(
    "+passwordHash",
  );

  if (!user) {
    const existing = await User.findOne({ email: g.email }).select(
      "+passwordHash",
    );
    if (existing) {
      if (existing.role !== ROLES.USER)
        throw new AppError(
          403,
          "GOOGLE_NOT_ALLOWED",
          "This Google account cannot be used for sign-in here.",
        );
      if (existing.googleSubject && existing.googleSubject !== g.sub) {
        throw new AppError(
          409,
          "GOOGLE_CONFLICT",
          "This email is linked to a different Google account.",
        );
      }
      // Safe linking: Google asserts a verified email we've already checked. If the local account was never
      // verified, anyone could have pre-registered it with their own password — so that password is discarded.
      if (!existing.emailVerified) existing.passwordHash = undefined;
      existing.googleSubject = g.sub;
      existing.emailVerified = true;
      await existing.save();
      user = existing;
    } else {
      user = await User.create({
        name:
          g.name.trim().length >= 2
            ? g.name.trim().slice(0, 80)
            : g.email.split("@")[0].slice(0, 80).padEnd(2, "_"),
        email: g.email,
        googleSubject: g.sub,
        emailVerified: true,
        role: ROLES.USER,
        status: USER_STATUS.ACTIVE,
        approvalStatus: APPROVAL.APPROVED, // normal users need no administrator approval
      });
    }
  }
  if (user.role !== ROLES.USER)
    throw new AppError(
      403,
      "GOOGLE_NOT_ALLOWED",
      "This Google account cannot be used for sign-in here.",
    );
  assertAccountAllowed(user);
  const session = await createSession(user, req, res, { remember: true });
  return ok(res, "Signed in with Google.", session);
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({
    email,
    role: ROLES.USER,
    emailVerified: true,
    status: USER_STATUS.ACTIVE,
  });
  if (user) {
    sendOtp({
      email,
      purpose: OTP_PURPOSE.PASSWORD_RESET,
      name: user.name,
    }).catch((e) => logger.warn({ code: e.code }, "reset email failed"));
  }
  return ok(
    res,
    "If an account exists for this email, we have sent a reset code.",
    {
      email,
      otpExpiresInSeconds: OTP_TTL_SECONDS,
      resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    },
  );
});

exports.verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  await verifyOtp({ email, purpose: OTP_PURPOSE.PASSWORD_RESET, code });
  const user = await User.findOne({
    email,
    role: ROLES.USER,
    emailVerified: true,
    status: USER_STATUS.ACTIVE,
  }).select("+passwordHash");
  if (!user)
    throw new AppError(
      400,
      "INVALID_OTP",
      "That code is invalid or has expired. Request a new code.",
    );
  const resetToken = signResetToken({
    sub: String(user._id),
    pwv: passwordVersion(user.passwordHash),
  });
  return ok(res, "Code verified. Choose a new password.", { resetToken });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const claims = verifyResetToken(req.body.resetToken);
  const user = await User.findById(claims.sub).select("+passwordHash");
  if (
    !user ||
    user.role !== ROLES.USER ||
    user.status !== USER_STATUS.ACTIVE ||
    passwordVersion(user.passwordHash) !== claims.pwv
  ) {
    throw new AppError(
      400,
      "INVALID_RESET_TOKEN",
      'This reset link has expired. Start again from "Forgot password".',
    );
  }
  const passwordHash = await hashPassword(req.body.password);
  // Compare-and-set on the old hash: a reset token can only ever be spent once.
  const guard = user.passwordHash
    ? { passwordHash: user.passwordHash }
    : { passwordHash: { $exists: false } };
  const { modifiedCount } = await User.updateOne(
    { _id: user._id, ...guard },
    { $set: { passwordHash } },
  );
  if (!modifiedCount)
    throw new AppError(
      400,
      "INVALID_RESET_TOKEN",
      'This reset link has expired. Start again from "Forgot password".',
    );
  await Otp.deleteMany({
    email: user.email,
    purpose: OTP_PURPOSE.PASSWORD_RESET,
  });
  await revokeAllForAccount(user);
  return ok(res, "Password updated. Log in with your new password.");
});

exports.refresh = asyncHandler(async (req, res) => {
  try {
    const session = await rotateSession(
      req.cookies?.[REFRESH_COOKIE],
      req,
      res,
    );
    return ok(res, "Session refreshed.", session);
  } catch (err) {
    if (err.code !== "REFRESH_RACE") clearRefreshCookie(res);
    throw err;
  }
});

exports.logout = asyncHandler(async (req, res) => {
  await revokeByRefreshToken(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  return ok(res, "Signed out.");
});

exports.me = (req, res) =>
  ok(res, "Profile loaded.", { user: serialize(req.account) });
