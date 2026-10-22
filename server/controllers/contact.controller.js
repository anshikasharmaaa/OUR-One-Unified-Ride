"use strict";
const ContactMessage = require("../models/ContactMessage");
const asyncHandler = require("../utils/asyncHandler");
const { created } = require("../utils/response");
const { newTicketId } = require("../utils/ticket");

const THANKS = "Thanks, your message has been received.";

exports.create = asyncHandler(async (req, res) => {
  const { website, ...data } = req.body;
  // "website" is a hidden honeypot: humans never fill it. Bots get the same reply and nothing is stored.
  if (website) return created(res, THANKS, {});
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const doc = await ContactMessage.create({
        ...data,
        ticketId: newTicketId(),
        status: "OPEN",
        ip: req.ip,
      });
      return created(res, THANKS, { ticketId: doc.ticketId }); // only after the database confirmed the write
    } catch (err) {
      if (err?.code !== 11000 || attempt === 4) throw err; // ticket-id collision: try another
    }
  }
  return undefined;
});
