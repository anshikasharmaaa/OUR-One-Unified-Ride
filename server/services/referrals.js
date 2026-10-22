"use strict";
const crypto = require("crypto");
const { User } = require("../models");
const Referral = require("../models/Referral");
const AppError = require("../utils/AppError");
const { notify } = require("./notifications");
const {
  REFERRAL_STATUS,
  NOTIFICATION,
  REFERRAL_APPLY_WINDOW_DAYS,
  USER_STATUS,
} = require("../config/constants");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
const DAY = 86400000;
const newCode = () =>
  `OUR${Array.from({ length: 6 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("")}`;

const ALREADY = () =>
  new AppError(
    409,
    "ALREADY_REFERRED",
    "You have already used a referral code.",
  );

/** Stable, unique code. Generated once on first request; collisions are caught by the unique index and retried. */
async function ensureCode(userId) {
  const existing = await User.findById(userId).select("referralCode");
  if (existing?.referralCode) return existing.referralCode;
  for (let i = 0; i < 6; i += 1) {
    try {
      const r = await User.updateOne(
        { _id: userId, referralCode: { $exists: false } },
        { $set: { referralCode: newCode() } },
      );
      if (
        r.modifiedCount === 1 ||
        (await User.exists({ _id: userId, referralCode: { $exists: true } }))
      ) {
        return (await User.findById(userId).select("referralCode"))
          .referralCode;
      }
    } catch (e) {
      if (e.code !== 11000) throw e; // duplicate code: try another
    }
  }
  throw new AppError(
    500,
    "REFERRAL_CODE_FAILED",
    "We could not create your referral code. Please try again.",
  );
}

/** The active account that owns this code, or null. Used by signup and by "add a code". */
async function findReferrer(raw) {
  const code = String(raw || "")
    .trim()
    .toUpperCase();
  if (!code) return null;
  return User.findOne({
    referralCode: code,
    status: USER_STATUS.ACTIVE,
    deletedAt: null,
  })
    .select("_id referralCode")
    .lean();
}

async function summary(userId) {
  const code = await ensureCode(userId);
  const [pending, qualified, me] = await Promise.all([
    Referral.countDocuments({
      referrer: userId,
      status: REFERRAL_STATUS.PENDING,
    }),
    Referral.countDocuments({
      referrer: userId,
      status: REFERRAL_STATUS.QUALIFIED,
    }),
    User.findById(userId).select("referredBy createdAt"),
  ]);
  const windowEndsAt = new Date(
    me.createdAt.getTime() + REFERRAL_APPLY_WINDOW_DAYS * DAY,
  );
  let appliedCode = null;
  if (me.referredBy) {
    const r = await Referral.findOne({ referred: userId }).select("status");
    appliedCode = { status: r?.status || REFERRAL_STATUS.PENDING }; // never reveals who referred you
  }
  return {
    code,
    totals: { pending, qualified, total: pending + qualified },
    appliedCode,
    canApply: !me.referredBy && Date.now() < windowEndsAt.getTime(),
    applyWindowDays: REFERRAL_APPLY_WINDOW_DAYS,
  };
}

const notifyBoth = (referrerId, referredId) =>
  Promise.all([
    notify(referredId, {
      type: NOTIFICATION.REFERRAL_APPLIED,
      title: "Referral code added",
      body: "Your referral will count the next time you compare fares.",
      link: "/profile/referral",
    }),
    notify(referrerId, {
      type: NOTIFICATION.REFERRAL_JOINED,
      title: "Someone used your referral code",
      body: "It will count the next time they compare fares.",
      link: "/profile/referral",
    }),
  ]);

/**
 * Signup stored the referrer on the new user (referredBy). The Referral record is only created once the email is
 * verified, so unverified throwaway sign-ups never inflate anyone's totals. Safe to call twice (unique index).
 */
async function createFromSignup(userId) {
  const me = await User.findById(userId).select("referredBy");
  if (!me?.referredBy) return;
  const referrer = await User.findOne({
    _id: me.referredBy,
    status: USER_STATUS.ACTIVE,
    deletedAt: null,
  }).select("referralCode");
  if (!referrer?.referralCode) return;
  try {
    await Referral.create({
      referrer: referrer._id,
      referred: userId,
      code: referrer.referralCode,
    });
  } catch (e) {
    if (e.code === 11000) return; // already recorded
    throw e;
  }
  await notifyBoth(referrer._id, userId);
}

/** "Add a referral code" from the profile (works for Google sign-ups too). Atomic: only one code can ever be claimed. */
async function applyCode(userId, raw) {
  const me = await User.findById(userId).select("referredBy createdAt");
  if (me.referredBy) throw ALREADY();
  if (Date.now() > me.createdAt.getTime() + REFERRAL_APPLY_WINDOW_DAYS * DAY) {
    throw new AppError(
      409,
      "REFERRAL_WINDOW_CLOSED",
      `Referral codes can only be added within ${REFERRAL_APPLY_WINDOW_DAYS} days of signing up.`,
    );
  }
  const referrer = await findReferrer(raw);
  if (!referrer)
    throw new AppError(
      404,
      "INVALID_REFERRAL_CODE",
      "That referral code isn’t valid.",
    );
  if (String(referrer._id) === String(userId))
    throw new AppError(
      400,
      "SELF_REFERRAL",
      "You can’t use your own referral code.",
    );

  const claimed = await User.findOneAndUpdate(
    { _id: userId, referredBy: { $exists: false } },
    { $set: { referredBy: referrer._id } },
  );
  if (!claimed) throw ALREADY();
  try {
    await Referral.create({
      referrer: referrer._id,
      referred: userId,
      code: referrer.referralCode,
    });
  } catch (e) {
    await User.updateOne({ _id: userId }, { $unset: { referredBy: "" } }); // keep both records consistent
    if (e.code === 11000) throw ALREADY();
    throw e;
  }
  await notifyBoth(referrer._id, userId);
  return summary(userId);
}

/** Called after a genuine NEW fare comparison. Qualifies this user's pending referral, once. */
async function qualifyIfEligible(userId) {
  const r = await Referral.findOneAndUpdate(
    { referred: userId, status: REFERRAL_STATUS.PENDING },
    { $set: { status: REFERRAL_STATUS.QUALIFIED, qualifiedAt: new Date() } },
    { new: true },
  );
  if (r) {
    await notify(r.referrer, {
      type: NOTIFICATION.REFERRAL_QUALIFIED,
      title: "A referral qualified",
      body: "Someone you referred compared fares for the first time after joining.",
      link: "/profile/referral",
    });
  }
}

module.exports = {
  ensureCode,
  findReferrer,
  summary,
  createFromSignup,
  applyCode,
  qualifyIfEligible,
};
