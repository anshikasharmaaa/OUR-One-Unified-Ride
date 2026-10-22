"use strict";
const mongoose = require("mongoose");

const STATUS = ["OPEN", "IN_PROGRESS", "RESOLVED"];

// One admin reply. The row is written BEFORE the email is attempted, so a crash can never lose the record.
const replySchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, maxlength: 64 }, // idempotency key from the admin's browser
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminName: { type: String, maxlength: 80 },
    message: { type: String, required: true, maxlength: 5000 },
    state: {
      type: String,
      enum: ["SENDING", "SENT", "FAILED"],
      default: "SENDING",
    },
    messageId: { type: String, maxlength: 300 },
    error: { type: String, maxlength: 80 }, // short error code only, never a secret
    sentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const contactMessageSchema = new mongoose.Schema(
  {
    ticketId: { type: String, maxlength: 30 },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    organisation: { type: String, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    subject: { type: String, required: true, trim: true, maxlength: 60 },
    message: { type: String, required: true, trim: true, maxlength: 1500 }, // the original is never overwritten
    ip: { type: String, maxlength: 64 },
    status: { type: String, enum: STATUS, default: "OPEN" },
    replies: { type: [replySchema], default: [] },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

contactMessageSchema.index({ ticketId: 1 }, { unique: true, sparse: true }); // sparse: older records have none until migrated
contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
module.exports.STATUS = STATUS;
