"use strict";
// TEMPORARY. Admin approval no longer exists, but the sign-in gate for PENDING users lives in files that were not
// supplied (services/accounts.js, models/User.js). Until they are replaced, this marks verified PENDING users
// as approved every 30 seconds so nobody is locked out. DELETE this file and its call in server.js once the gate is removed.
const { User } = require("../models");
const logger = require("../utils/logger");

async function autoApprovePending() {
  try {
    await User.updateMany(
      {
        role: "USER",
        emailVerified: true,
        approvalStatus: "PENDING",
        deletedAt: null,
      },
      { $set: { approvalStatus: "APPROVED" } },
    );
  } catch (err) {
    logger.warn({ message: err.message }, "approval bridge failed");
  }
}
function startApprovalBridge() {
  const t = setInterval(autoApprovePending, 30000);
  t.unref();
  autoApprovePending();
  return t;
}
module.exports = { startApprovalBridge, autoApprovePending };
