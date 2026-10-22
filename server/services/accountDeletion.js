"use strict";
const {
  User,
  Otp,
  RideSearch,
  RideEvent,
  FavoriteLocation,
  Notification,
  Avatar,
} = require("../models");
const Comparison = require("../models/Comparison");
const Booking = require("../models/Booking");
const { USER_STATUS } = require("../config/constants");

const REMOVED = "[removed]";

/**
 * Deletes personal data and anonymises the account. Retention policy:
 *  - removed: profile photo, favorites, notifications, pending codes, comparisons, bookings
 *  - kept, anonymised: the user document (so references stay valid), searches (user link and text removed),
 *    ride events (type/provider/fare/timestamps kept; location text and coordinates replaced by "[removed]")
 *  - kept: referral links between accounts (no personal details; the user is now "Deleted user")
 */
async function anonymize(user) {
  const id = user._id;
  await Promise.all([
    Avatar.deleteOne({ user: id }),
    FavoriteLocation.deleteMany({ user: id }),
    Notification.deleteMany({ user: id }),
    Otp.deleteMany({ email: user.email }),
    Comparison.deleteMany({ user: id }),
    Booking.deleteMany({ user: id }),
    RideSearch.updateMany(
      { user: id },
      { $set: { user: null, pickup: REMOVED, dropoff: REMOVED } },
    ),
    // RideEvent is append-only through Mongoose; this redaction is a deliberate exception.
    RideEvent.collection.updateMany(
      { user: id },
      {
        $set: {
          "pickup.address": REMOVED,
          "dropoff.address": REMOVED,
          coordsRounded: true,
        },
        $unset: {
          "pickup.lat": "",
          "pickup.lng": "",
          "dropoff.lat": "",
          "dropoff.lng": "",
        },
      },
    ),
  ]);
  await User.updateOne(
    { _id: id },
    {
      $set: {
        name: "Deleted user",
        email: `deleted-${id}@deleted.invalid`,
        emailVerified: false,
        status: USER_STATUS.SUSPENDED,
        avatarVersion: 0,
        deletedAt: new Date(),
      },
      $unset: {
        passwordHash: "",
        googleSubject: "",
        phone: "",
        gender: "",
        dateOfBirth: "",
        emergencyContact: "",
        avatarColor: "",
        referralCode: "",
      },
    },
  );
}

module.exports = { anonymize };
