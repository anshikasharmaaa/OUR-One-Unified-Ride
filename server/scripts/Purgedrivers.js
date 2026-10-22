"use strict";
/**
 * One-off cleanup of the retired driver system (OUR does not manage drivers).
 *   node scripts/purgeDrivers.js --dry                              # list what would be removed
 *   node scripts/purgeDrivers.js --export=drivers-audit.json --dry  # also write an audit copy, remove nothing
 *   node scripts/purgeDrivers.js --export=drivers-audit.json        # audit copy, then remove APPROVED drivers
 *   node scripts/purgeDrivers.js --status=ALL                       # remove every driver
 * Removes the driver documents, their refresh sessions and their pending email codes.
 */
require("../config/env");
const fs = require("fs");
const mongoose = require("mongoose");
const { connectDb, disconnectDb } = require("../config/db");
const { Session, Otp } = require("../models");

const argValue = (name) => {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : undefined;
};

(async () => {
  const dry = process.argv.includes("--dry");
  const status = (argValue("status") || "APPROVED").toUpperCase();
  const exportPath = argValue("export");
  await connectDb();

  const drivers = mongoose.connection.collection("drivers");
  const filter = status === "ALL" ? {} : { approvalStatus: status };
  const rows = await drivers.find(filter).toArray();
  console.log(`${rows.length} driver(s) match (${status}):`);
  rows.forEach((d) =>
    console.log(` - ${d.name} <${d.email}> [${d.approvalStatus}]`),
  );

  if (exportPath && rows.length) {
    const safe = rows.map(({ passwordHash, ...rest }) => rest); // never export credentials
    fs.writeFileSync(exportPath, JSON.stringify(safe, null, 2), {
      mode: 0o600,
    });
    console.log(
      `Audit copy written to ${exportPath} (password hashes excluded).`,
    );
  }

  if (dry) console.log("Dry run: nothing removed.");
  else if (rows.length) {
    const ids = rows.map((d) => d._id);
    const emails = rows.map((d) => d.email).filter(Boolean);
    const s = await Session.deleteMany({
      principalType: "DRIVER",
      principalId: { $in: ids },
    });
    const o = emails.length
      ? await Otp.deleteMany({ email: { $in: emails } })
      : { deletedCount: 0 };
    const d = await drivers.deleteMany({ _id: { $in: ids } });
    console.log(
      `Removed ${d.deletedCount} driver(s), ${s.deletedCount} session(s), ${o.deletedCount} code(s).`,
    );
  }
  await disconnectDb();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
