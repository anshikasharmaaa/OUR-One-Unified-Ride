"use strict";
const env = require("./config/env");
const logger = require("./utils/logger");
const { connectDb, disconnectDb } = require("./config/db");
const app = require("./app");
const { startRetention } = require("./services/retention");
const { startApprovalBridge } = require("./services/approvalBridge");

async function main() {
  await connectDb();
  const server = app.listen(env.port, () =>
    logger.info(`OUR API listening on :${env.port} (${env.nodeEnv})`),
  );
  if (!env.isTest) {
    startRetention(); // rounds coordinates of ride events older than 180 days, once a day
    startApprovalBridge(); // temporary: see services/approvalBridge.js
  }

  let closing = false;
  const shutdown = async (signal) => {
    if (closing) return;
    closing = true;
    logger.info({ signal }, "Shutting down");
    const force = setTimeout(() => process.exit(1), 10000);
    force.unref();
    server.close(async () => {
      await disconnectDb().catch(() => {});
      process.exit(0);
    });
  };
  ["SIGINT", "SIGTERM"].forEach((s) => process.on(s, () => shutdown(s)));
}

process.on("unhandledRejection", (reason) =>
  logger.error({ reason: String(reason) }, "Unhandled rejection"),
);
main().catch((err) => {
  logger.error({ message: err.message }, "Failed to start server");
  process.exit(1);
});
