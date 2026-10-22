"use strict";
const { z } = require("zod");
const C = require("../config/constants");

const mobile = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number.");
const optionalMobile = z.union([mobile, z.literal("")]);
const dob = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth.")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    return (
      !Number.isNaN(d.getTime()) &&
      d.toISOString().slice(0, 10) === s &&
      d.getUTCFullYear() >= 1900 &&
      d <= new Date()
    );
  }, "Enter a valid date of birth.");

// .strict(): any field not listed here (role, email, status, referral fields...) is rejected, so it can never be mass-assigned.
exports.updateProfile = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(80).optional(),
    phone: optionalMobile.optional(),
    gender: z.enum([...C.GENDERS, ""]).optional(),
    dateOfBirth: z.union([dob, z.literal("")]).optional(),
    emergencyContact: z
      .object({
        name: z.string().trim().max(80).default(""),
        phone: optionalMobile,
      })
      .refine((v) => !v.name || v.phone, {
        message: "Add a phone number for your emergency contact.",
        path: ["phone"],
      })
      .optional(),
    avatarColor: z.enum(C.AVATAR_COLORS).optional(),
  })
  .strict();

exports.changePassword = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128),
  })
  .strict()
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: "Choose a different password.",
    path: ["newPassword"],
  });

// Accounts with a password confirm with it; Google-only accounts retype their email instead.
exports.deleteAccount = z
  .object({
    password: z.string().max(128).optional(),
    confirmEmail: z.string().trim().toLowerCase().max(254).optional(),
    confirm: z
      .string()
      .refine((v) => v === "DELETE", "Type DELETE to confirm."),
  })
  .strict();

/* ---------- Favorites ---------- */
const lat = z.number().min(-90).max(90).nullable().optional();
const lng = z.number().min(-180).max(180).nullable().optional();
const placeId = z.string().trim().min(1).max(300).nullable().optional();
const favBase = z.object({
  label: z.enum(C.FAVORITE_LABELS),
  name: z.string().trim().max(60).default(""),
  address: z.string().trim().min(3, "Enter an address.").max(300),
  placeId,
  lat,
  lng,
});
// A saved location is either fully resolved (placeId + lat + lng) or has no coordinates at all.
const together = (v) =>
  (v.lat == null) === (v.lng == null) &&
  (v.lat == null) === (v.placeId == null);
const togetherMsg = {
  message:
    "Choose the place from the suggestions so its location can be saved.",
  path: ["address"],
};
exports.favoriteCreate = favBase.strict().refine(together, togetherMsg);
exports.favoriteUpdate = favBase
  .partial()
  .strict()
  .refine(together, togetherMsg);

exports.applyReferral = z
  .object({ code: z.string().trim().min(4).max(20) })
  .strict();

const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(50).default(10);
exports.rideListQuery = z.object({
  page,
  limit,
  type: z.enum(Object.values(C.RIDE_EVENT)).optional(),
});
exports.notificationQuery = z.object({
  page,
  limit,
  unread: z.enum(["true", "false"]).optional(),
});
exports.adminUsersQuery = z.object({
  page,
  limit,
  approval: z.enum(Object.values(C.APPROVAL)).optional(),
  q: z.string().trim().max(80).optional(),
});
