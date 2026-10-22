"use strict";
const mongoose = require("mongoose");

// Who looked at what. Written whenever an admin opens a user's details or ride history.
const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { type: String, required: true, maxlength: 60 },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
auditLogSchema.index({ subject: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
