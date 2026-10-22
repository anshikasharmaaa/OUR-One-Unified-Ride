"use strict";
const { z } = require("zod");
const { SEARCH_VEHICLES } = require("../config/constants");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email.")
  .max(254);
const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128);
const code = z
  .string()
  .trim()
  .min(4, "Enter the code from your email.")
  .max(10, "That code is too long.");
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

/* ---------- Auth ---------- */
exports.registerUser = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  email,
  password,
  // Optional. An empty string means "no code".
  referralCode: z
    .string()
    .trim()
    .max(20, "That referral code is too long.")
    .transform((v) => v.toUpperCase() || undefined)
    .optional(),
});

exports.verifyOtp = z.object({ email, code });
exports.emailOnly = z.object({ email });

exports.loginUser = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128),
  rememberMe: z.boolean().optional(),
});

exports.googleLogin = z.object({
  credential: z.string().min(10).max(4096),
});

exports.resetPassword = z.object({
  resetToken: z.string().min(10).max(2048),
  password,
});

/* ---------- Admin ---------- */
exports.loginAdmin = z.object({
  email,
  password: z.string().min(1, "Enter your password.").max(128),
});

exports.idParam = z.object({ id: objectId });

exports.approvalBody = z
  .object({ status: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]) })
  .strict();

exports.analyticsQuery = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
});

/* ---------- Ride searches ---------- */
exports.createSearch = z.object({
  pickup: z.string().trim().min(2).max(120),
  dropoff: z.string().trim().min(2).max(120),
  vehicleType: z.enum(SEARCH_VEHICLES).default("ANY"),
});

exports.pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
