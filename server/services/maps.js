"use strict";
const env = require("../config/env");
const logger = require("../utils/logger");
const { createMapsClient } = require("./osmClient");

module.exports = createMapsClient({
  routingUrl: env.maps.routingUrl,
  reverseUrl: env.maps.reverseUrl,
  userAgent: env.maps.userAgent,
  log: (o, m) => logger.warn(o, m),
});
