"use strict";
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const pinoHttp = require("pino-http");
const mongoose = require("mongoose");
const env = require("./config/env");
const logger = require("./utils/logger");
const { notFound, errorHandler } = require("./middleware/error");
const { apiLimiter } = require("./middleware/rateLimit");

const app = express();
app.set("trust proxy", env.trustProxy);
app.disable("x-powered-by");

if (!env.isTest)
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/api/health" },
    }),
  );
app.use(helmet());
const allowedOrigins = [
  env.clientOrigin,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 600,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    message: dbUp ? "OK" : "Database unavailable",
    data: {
      status: dbUp ? "ok" : "degraded",
      db: dbUp ? "up" : "down",
      uptimeSeconds: Math.round(process.uptime()),
    },
  });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/searches", require("./routes/search.routes"));
app.use("/api/comparisons", require("./routes/comparison.routes"));
app.use("/api/maps", require("./routes/maps.routes"));
app.use("/api/rides", require("./routes/rides.routes"));
app.use("/api/contact", require("./routes/contact.routes"));
app.use("/api/me", require("./routes/me.routes")); // the one profile/account API (the old /api/account stack was removed)

app.use(notFound);
app.use(errorHandler);

module.exports = app;
