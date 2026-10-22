import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .max(254);
export const nameField = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(80, "Name is too long.")
  .regex(
    /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u,
    "Name can only contain letters, spaces, '.', '-' and apostrophes.",
  );

export const PASSWORD_RULES = [
  { id: "len", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "num", label: "One number", test: (v) => /\d/.test(v) },
  {
    id: "sym",
    label: "One special character",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export const newPasswordField = z
  .string()
  .min(1, "Create a password.")
  .max(64, "Use 64 characters or fewer.")
  .superRefine((v, ctx) => {
    if (PASSWORD_RULES.some((r) => !r.test(v)))
      ctx.addIssue({
        code: "custom",
        message: "Password does not meet all the requirements below.",
      });
  });

const withMatch = (shape) =>
  z
    .object(shape)
    .refine((d) => d.password === d.confirmPassword, {
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
  rememberMe: z.boolean().optional(),
});

// Optional. The server checks that the code belongs to a real account.
export const referralField = z
  .string()
  .trim()
  .max(20, "That referral code is too long.")
  .regex(/^[A-Za-z0-9]*$/, "Referral codes use letters and numbers only.")
  .optional();

export const signupSchema = withMatch({
  name: nameField,
  email: emailField,
  password: newPasswordField,
  confirmPassword: z.string().min(1, "Confirm your password."),
  referralCode: referralField,
});
export const forgotSchema = z.object({ email: emailField });
export const resetSchema = withMatch({
  password: newPasswordField,
  confirmPassword: z.string().min(1, "Confirm your password."),
});

export const mobileField = z
  .string()
  .trim()
  .min(1, "Enter your mobile number.")
  .refine(
    (v) =>
      /^[6-9]\d{9}$/.test(
        v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""),
      ),
    "Enter a valid 10-digit Indian mobile number.",
  );

export const driverSchema = withMatch({
  name: nameField,
  email: emailField,
  mobile: mobileField,
  city: z.string().trim().min(2, "Enter your city.").max(60),
  vehicleType: z.enum(["CAB", "AUTO", "BIKE_TAXI"], {
    errorMap: () => ({ message: "Choose a vehicle type." }),
  }),
  password: newPasswordField,
  confirmPassword: z.string().min(1, "Confirm your password."),
});
export const adminLoginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

const place = (what) =>
  z
    .string()
    .trim()
    .min(1, `Enter a ${what} location.`)
    .min(3, "Enter at least 3 characters.")
    .max(120, "Use 120 characters or fewer.");
export const searchSchema = z
  .object({
    pickup: place("pickup"),
    dropoff: place("drop-off"),
    vehicleType: z
      .enum(["ANY", "BIKE", "AUTO", "ECONOMY_CAB", "PREMIUM_CAB"])
      .default("ANY"),
  })
  .refine((d) => d.pickup.toLowerCase() !== d.dropoff.toLowerCase(), {
    path: ["dropoff"],
    message: "Pickup and drop-off must be different.",
  });

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters).")
    .max(1500, "Please keep it under 1500 characters."),
});
