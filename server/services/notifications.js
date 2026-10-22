"use strict";
const Notification = require("../models/Notification");
const logger = require("../utils/logger");

/** Best-effort: a failed notification must never break the action that caused it. */
async function notify(userId, { type, title, body = "", link = "" }) {
  try {
    await Notification.create({ user: userId, type, title, body, link });
  } catch (e) {
    logger.warn({ message: e.message, type }, "could not create notification");
  }
}

module.exports = { notify };
