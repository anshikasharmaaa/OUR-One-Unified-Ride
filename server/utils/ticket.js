"use strict";
const crypto = require("crypto");
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** OUR-YYMM-XXXXXX: short enough to quote in an email, random enough not to be guessable. */
function newTicketId(now = new Date()) {
  const rand = Array.from(
    crypto.randomBytes(6),
    (b) => ALPHABET[b % ALPHABET.length],
  ).join("");
  const yy = String(now.getUTCFullYear()).slice(2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `OUR-${yy}${mm}-${rand}`;
}
module.exports = { newTicketId };
