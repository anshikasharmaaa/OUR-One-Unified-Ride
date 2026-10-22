"use strict";

const { User } = require("../models");
const { ROLES, USER_STATUS } = require("../config/constants");
const { hashPassword } = require("./passwords");
const { loginAdmin } = require("../validators/schemas");
const { z } = require("zod");

const adminInput = z.object({
  name: z.string().trim().min(2).max(80),
  email: loginAdmin.shape.email,
  password: z.string().min(12, "Password must be at least 12 characters long"),
});

/**
 * Idempotent: creates the admin only if it doesn't exist.
 * Never changes an existing account's password.
 */
async function bootstrapAdmin(input) {
  const parsed = adminInput.safeParse(input);

  if (!parsed.success) {
    const reasons = parsed.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`,
    );

    throw new Error(`Invalid admin bootstrap values — ${reasons.join("; ")}`);
  }

  const { name, email, password } = parsed.data;

  const existing = await User.findOne({ email });

  if (existing) {
    if (existing.role !== ROLES.ADMIN) {
      throw new Error(
        "A non-admin account already uses ADMIN_EMAIL. Choose a different address.",
      );
    }

    return { created: false };
  }

  await User.create({
    name,
    email,
    role: ROLES.ADMIN,
    emailVerified: true,
    status: USER_STATUS.ACTIVE,
    passwordHash: await hashPassword(password),
  });

  return { created: true };
}

module.exports = { bootstrapAdmin };
