"use strict";
require("dotenv").config();
const { z } = require("zod");

const optional = z.string().trim().optional().default("");
const bool = z
  .enum(["true", "false"])
  .optional()
  .default("false")
  .transform((v) => v === "true");
const boolOn = z
  .enum(["true", "false"])
  .optional()
  .default("true")
  .transform((v) => v === "true");

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_URL: z.string().url(),
  MONGODB_URI: z.string().min(1),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  ACCESS_TOKEN_SECRET: z.string().min(32, "must be at least 32 characters"),
  REFRESH_TOKEN_SECRET: z.string().min(32, "must be at least 32 characters"),
  OTP_SECRET: z.string().min(32, "must be at least 32 characters"),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  COOKIE_DOMAIN: optional,
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),

  GOOGLE_CLIENT_ID: optional,

  // Free OpenStreetMap-based services (no keys). Defaults are the public servers; point these at your own in production.
  OSRM_URL: z.string().url().default("https://router.project-osrm.org"),
  NOMINATIM_URL: z
    .string()
    .url()
    .default("https://nominatim.openstreetmap.org"),
  GEO_CONTACT: optional, // email/URL that identifies this app to Nominatim (their usage policy requires it)
  // Ride comparison data. Nothing is invented: with all of these empty, cards show "not connected".
  FARE_ESTIMATES_ENABLED: bool,
  FARE_MODEL_JSON: optional,
  LOCAL_PROVIDERS_JSON: optional,
  // Ride providers: server-side only, never sent to the browser.
  RIDE_DATA_MODE: z.enum(["demo", "live"]).default("demo"),
  OLA_API_ENABLED: bool,
  UBER_API_ENABLED: bool,
  RAPIDO_API_ENABLED: bool,
  OLA_XAPP_TOKEN: optional, // partner token issued by Ola (deep links + API)
  OLA_API_BASE_URL: optional,
  UBER_CLIENT_ID: optional,
  UBER_CLIENT_SECRET: optional,
  UBER_API_BASE_URL: optional,
  RAPIDO_API_BASE_URL: optional,
  RAPIDO_API_KEY: optional,
  RIDE_PROVIDER_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(500)
    .max(30000)
    .default(8000),
  DEMO_DRIVERS: boolOn, // false => demo bookings show the "no driver configured" empty state
  DEMO_PROVIDERS_JSON: optional,

  SMTP_HOST: optional,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: bool,
  SMTP_USER: optional,
  SMTP_PASS: optional,
  EMAIL_FROM: z.string().default("OUR <no-reply@example.com>"),
  EMAIL_LOGO_URL: optional,
  EMAIL_LOGO_PATH: optional, // file on the server; sent inline so the logo shows even without a public URL
  SUPPORT_EMAIL: optional, // shown in reply emails and used as Reply-To

  RATE_LIMIT_DISABLED: bool,
  TEST_MONGODB_URI: optional,
  ADMIN_NAME: optional,
  ADMIN_EMAIL: optional,
  ADMIN_PASSWORD: optional,
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (i) => `  - ${i.path.join(".")}: ${i.message}`,
  );
  // Only variable names and reasons are printed — never values.
  throw new Error(
    `Invalid environment configuration:\n${lines.join("\n")}\nSee server/.env.example.`,
  );
}
const e = parsed.data;

const requireWhen = (on, flag, vars) => {
  if (!on) return;
  const missing = vars.filter((k) => !e[k]);
  if (missing.length)
    throw new Error(
      `${flag}=true requires: ${missing.join(", ")}. See server/.env.example.`,
    );
};
requireWhen(e.OLA_API_ENABLED, "OLA_API_ENABLED", [
  "OLA_API_BASE_URL",
  "OLA_XAPP_TOKEN",
]);
requireWhen(e.UBER_API_ENABLED, "UBER_API_ENABLED", [
  "UBER_API_BASE_URL",
  "UBER_CLIENT_ID",
  "UBER_CLIENT_SECRET",
]);
requireWhen(e.RAPIDO_API_ENABLED, "RAPIDO_API_ENABLED", [
  "RAPIDO_API_BASE_URL",
  "RAPIDO_API_KEY",
]);
for (const k of [
  "OLA_API_BASE_URL",
  "UBER_API_BASE_URL",
  "RAPIDO_API_BASE_URL",
]) {
  if (e[k] && !e[k].startsWith("https://"))
    throw new Error(`${k} must start with https://`);
}

if (e.NODE_ENV === "production") {
  if (e.COOKIE_SAMESITE === "none" && !e.CLIENT_URL.startsWith("https://")) {
    throw new Error("COOKIE_SAMESITE=none requires an https CLIENT_URL.");
  }
  if (
    new Set([e.ACCESS_TOKEN_SECRET, e.REFRESH_TOKEN_SECRET, e.OTP_SECRET])
      .size !== 3
  ) {
    throw new Error(
      "ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET and OTP_SECRET must all be different.",
    );
  }
}

module.exports = Object.freeze({
  nodeEnv: e.NODE_ENV,
  isProd: e.NODE_ENV === "production",
  isTest: e.NODE_ENV === "test",
  port: e.PORT,
  clientUrl: e.CLIENT_URL,
  clientOrigin: new URL(e.CLIENT_URL).origin,
  mongoUri:
    e.NODE_ENV === "test" ? e.TEST_MONGODB_URI || e.MONGODB_URI : e.MONGODB_URI,
  trustProxy: e.TRUST_PROXY,
  accessTokenSecret: e.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: e.REFRESH_TOKEN_SECRET,
  otpSecret: e.OTP_SECRET,
  accessTokenTtlSeconds: e.ACCESS_TOKEN_TTL_MINUTES * 60,
  bcryptRounds: e.BCRYPT_ROUNDS,
  cookie: {
    domain: e.COOKIE_DOMAIN || undefined,
    sameSite: e.COOKIE_SAMESITE,
    secure: e.NODE_ENV === "production",
  },
  googleClientId: e.GOOGLE_CLIENT_ID,
  maps: {
    routingUrl: e.OSRM_URL.replace(/\/$/, ""),
    reverseUrl: e.NOMINATIM_URL.replace(/\/$/, ""),
    userAgent: `OUR-OneUnifiedRide/1.0 (${e.GEO_CONTACT || "contact not set"})`,
  },
  fares: {
    estimatesEnabled: e.FARE_ESTIMATES_ENABLED,
    fareModelJson: e.FARE_MODEL_JSON,
    localProvidersJson: e.LOCAL_PROVIDERS_JSON,
  },
  rides: {
    dataMode: e.RIDE_DATA_MODE,
    enabled: {
      ola: e.OLA_API_ENABLED,
      uber: e.UBER_API_ENABLED,
      rapido: e.RAPIDO_API_ENABLED,
    },
    olaXappToken: e.OLA_XAPP_TOKEN,
    providerTimeoutMs: e.RIDE_PROVIDER_TIMEOUT_MS,
    demoDrivers: e.DEMO_DRIVERS,
    demoProvidersJson: e.DEMO_PROVIDERS_JSON,
    // Used only by future live adapters, inside the server.
    credentials: {
      ola: { baseUrl: e.OLA_API_BASE_URL, xappToken: e.OLA_XAPP_TOKEN },
      uber: {
        baseUrl: e.UBER_API_BASE_URL,
        clientId: e.UBER_CLIENT_ID,
        clientSecret: e.UBER_CLIENT_SECRET,
      },
      rapido: { baseUrl: e.RAPIDO_API_BASE_URL, apiKey: e.RAPIDO_API_KEY },
    },
  },
  smtp: {
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE,
    user: e.SMTP_USER,
    pass: e.SMTP_PASS,
  },
  emailFrom: e.EMAIL_FROM,
  emailLogoUrl:
    e.EMAIL_LOGO_URL || `${new URL(e.CLIENT_URL).origin}/assets/logo.png`,
  emailLogoPath: e.EMAIL_LOGO_PATH,
  supportEmail: e.SUPPORT_EMAIL,
  rateLimitDisabled: e.RATE_LIMIT_DISABLED || e.NODE_ENV === "test",
  admin: {
    name: e.ADMIN_NAME,
    email: e.ADMIN_EMAIL,
    password: e.ADMIN_PASSWORD,
  },
});
