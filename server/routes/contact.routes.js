"use strict";
const router = require("express").Router();
const { z } = require("zod");
const c = require("../controllers/contact.controller");
const validate = require("../middleware/validate");
const { contactLimiter } = require("../middleware/contactLimiter");

const SUBJECTS = [
  "General question",
  "Feedback",
  "Collaboration",
  "Report a problem",
  "Other",
];

const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80),
  organisation: z.string().trim().max(80).optional().default(""),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\-\s]*$/, "Enter a valid phone number.")
    .optional()
    .default(""),
  email: z.string().trim().toLowerCase().email("Enter a valid email.").max(254),
  subject: z.enum(SUBJECTS),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters.")
    .max(1500),
  website: z.string().max(200).optional().default(""),
});

router.post("/", contactLimiter, validate(contactSchema), c.create);

module.exports = router;
