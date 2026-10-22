"use strict";
// One-time, idempotent. Usage:  node scripts/migrate-legacy.js [--include-rejected]
//  1. Contact queries created before tickets existed get a ticket ID and status OPEN.
//  2. Users stuck as PENDING (and, with the flag, REJECTED) become APPROVED, because approval no longer exists.
//     Accounts marked SUSPENDED are left untouched.
const { connectDb, disconnectDb } = require("../config/db");
const { User, ContactMessage } = require("../models");
const { newTicketId } = require("../utils/ticket");

(async () => {
  try {
    await connectDb();
    let tickets = 0;
    for await (const d of ContactMessage.find({
      $or: [{ ticketId: { $exists: false } }, { status: { $exists: false } }],
    })
      .select("_id ticketId status")
      .cursor()) {
      const set = {};
      if (!d.ticketId) set.ticketId = newTicketId(d.createdAt || new Date());
      if (!d.status) set.status = "OPEN";
      try {
        await ContactMessage.updateOne({ _id: d._id }, { $set: set });
        tickets += 1;
      } catch (e) {
        if (e.code === 11000) {
          set.ticketId = newTicketId();
          await ContactMessage.updateOne({ _id: d._id }, { $set: set });
          tickets += 1;
        } else throw e;
      }
    }
    const states = process.argv.includes("--include-rejected")
      ? ["PENDING", "REJECTED"]
      : ["PENDING"];
    const r = await User.updateMany(
      { role: "USER", approvalStatus: { $in: states } },
      { $set: { approvalStatus: "APPROVED" } },
    );
    console.log(
      `Contact queries updated: ${tickets}. Users set to approved: ${r.modifiedCount}.`,
    );
    await disconnectDb();
  } catch (err) {
    console.error(`Migration failed: ${err.message}`);
    process.exit(1);
  }
})();
