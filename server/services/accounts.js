"use strict";
const { User } = require("../models");
const AppError = require("../utils/AppError");
const { ROLES, USER_STATUS, APPROVAL } = require("../config/constants");

// Every principal is a User document (roles USER or ADMIN). The type is kept because
// existing Session documents store it; unknown legacy types resolve to "no account".
const principalTypeFor = () => "USER";

function serialize(acc) {
  const base = {
    id: String(acc._id),
    name: acc.name,
    email: acc.email,
    role: acc.role,
    emailVerified: acc.emailVerified,
  };
  if (acc.role === ROLES.USER)
    return {
      ...base,
      approvalStatus: acc.approvalStatus || APPROVAL.APPROVED,
      avatarColor: acc.avatarColor || "blue",
      avatarVersion: acc.avatarVersion || 0,
      createdAt: acc.createdAt,
    };
  return base;
}

// A session left over from the removed driver system (principalType "DRIVER") yields null,
// which callers treat as an invalid session.
const loadPrincipal = (type, id) =>
  type === "USER" ? User.findById(id) : Promise.resolve(null);

// Single source of truth for "may this account hold a session / use protected routes right now?"
function assertAccountAllowed(acc) {
  if (acc.role !== ROLES.USER && acc.role !== ROLES.ADMIN) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "This account cannot access the platform.",
    );
  }
  if (acc.status !== USER_STATUS.ACTIVE)
    throw new AppError(
      403,
      "ACCOUNT_SUSPENDED",
      "This account is suspended. Please contact support.",
    );
  if (acc.role === ROLES.USER) {
    if (!acc.emailVerified)
      throw new AppError(
        403,
        "EMAIL_NOT_VERIFIED",
        "Verify your email to continue.",
      );
    switch (
      acc.approvalStatus ||
      APPROVAL.APPROVED // no value = account predates the approval rule
    ) {
      case APPROVAL.APPROVED:
        return;
      case APPROVAL.REJECTED:
        throw new AppError(
          403,
          "RIDER_REJECTED",
          "Your registration was not approved. Please contact the platform administrator.",
        );
      case APPROVAL.SUSPENDED:
        throw new AppError(
          403,
          "RIDER_SUSPENDED",
          "This rider account is suspended. Access is unavailable.",
        );
      default:
        throw new AppError(
          403,
          "RIDER_PENDING",
          "This account is awaiting administrator review.",
        );
    }
  }
}

module.exports = {
  principalTypeFor,
  serialize,
  loadPrincipal,
  assertAccountAllowed,
};
