"use strict";
const { ContactMessage } = require("../models");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/response");
const logger = require("../utils/logger");
const { sendContactReplyEmail } = require("../services/email");

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ticketOf = (d) =>
  d.ticketId || `OUR-LEGACY-${String(d._id).slice(-6).toUpperCase()}`;
const OPEN_OR_LEGACY = {
  $or: [{ status: "OPEN" }, { status: { $exists: false } }],
};

const replyView = (r) => ({
  id: String(r._id),
  adminName: r.adminName || "Administrator",
  message: r.message,
  state: r.state,
  error: r.error || null,
  sentAt: r.sentAt || null,
  createdAt: r.createdAt,
});
const base = (d) => ({
  id: String(d._id),
  ticketId: ticketOf(d),
  name: d.name,
  email: d.email,
  subject: d.subject,
  status: d.status || "OPEN",
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
  replyCount: (d.replies || []).length,
});
const summary = (d) => ({ ...base(d), preview: d.message.slice(0, 120) });
const full = (d) => ({
  ...base(d),
  phone: d.phone || null,
  organisation: d.organisation || null,
  message: d.message,
  resolvedAt: d.resolvedAt || null,
  replies: (d.replies || []).map(replyView),
});

async function countsByStatus() {
  const rows = await ContactMessage.aggregate([
    { $group: { _id: { $ifNull: ["$status", "OPEN"] }, n: { $sum: 1 } } },
  ]);
  const by = Object.fromEntries(rows.map((r) => [r._id, r.n]));
  const open = by.OPEN || 0,
    inProgress = by.IN_PROGRESS || 0,
    resolved = by.RESOLVED || 0;
  return { open, inProgress, resolved, total: open + inProgress + resolved };
}

exports.counts = asyncHandler(async (_req, res) =>
  ok(res, "Counts loaded.", await countsByStatus()),
);

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, status, q, from, to } = req.q;
  const and = [];
  if (status === "OPEN") and.push(OPEN_OR_LEGACY);
  else if (status) and.push({ status });
  if (q) {
    const re = new RegExp(escapeRe(q), "i");
    and.push({
      $or: [{ name: re }, { email: re }, { ticketId: re }, { subject: re }],
    });
  }
  if (from || to) {
    and.push({
      createdAt: {
        ...(from ? { $gte: new Date(`${from}T00:00:00+05:30`) } : {}),
        ...(to ? { $lte: new Date(`${to}T23:59:59.999+05:30`) } : {}),
      },
    });
  }
  const filter = and.length ? { $and: and } : {};
  const [rows, total, counts] = await Promise.all([
    ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("-ip")
      .lean(),
    ContactMessage.countDocuments(filter),
    countsByStatus(),
  ]);
  return ok(res, "Queries loaded.", {
    items: rows.map(summary),
    total,
    page,
    limit,
    counts,
  });
});

exports.get = asyncHandler(async (req, res) => {
  const d = await ContactMessage.findById(req.params.id).select("-ip").lean();
  if (!d) throw new AppError(404, "NOT_FOUND", "Query not found.");
  return ok(res, "Query loaded.", { query: full(d) });
});

exports.setStatus = asyncHandler(async (req, res) => {
  const d = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { $set: { status: req.body.status, resolvedAt: null } },
    { new: true },
  )
    .select("-ip")
    .lean();
  if (!d) throw new AppError(404, "NOT_FOUND", "Query not found.");
  return ok(res, "Status updated.", { query: full(d) });
});

exports.reply = asyncHandler(async (req, res) => {
  const { message, requestId } = req.body;
  const id = req.params.id;
  const doc = await ContactMessage.findById(id).select("-ip").lean();
  if (!doc) throw new AppError(404, "NOT_FOUND", "Query not found.");

  const existing = (doc.replies || []).find((r) => r.requestId === requestId);
  let claimed;
  if (existing) {
    if (existing.state === "SENT")
      return ok(res, "This reply was already sent.", { query: full(doc) }); // double-click / retry: no second email
    if (existing.state === "SENDING")
      throw new AppError(
        409,
        "REPLY_IN_PROGRESS",
        "This reply is already being sent.",
      );
    claimed = await ContactMessage.findOneAndUpdate(
      // previously FAILED: retry, possibly with edited text
      { _id: id, replies: { $elemMatch: { requestId, state: "FAILED" } } },
      {
        $set: {
          "replies.$.state": "SENDING",
          "replies.$.message": message,
          "replies.$.error": null,
        },
      },
      { new: true },
    ).lean();
  } else {
    claimed = await ContactMessage.findOneAndUpdate(
      // atomic: only one request with this id can add the row
      { _id: id, "replies.requestId": { $ne: requestId } },
      {
        $push: {
          replies: {
            requestId,
            admin: req.auth.id,
            adminName: req.account?.name,
            message,
            state: "SENDING",
          },
        },
      },
      { new: true },
    ).lean();
  }
  if (!claimed)
    throw new AppError(
      409,
      "REPLY_IN_PROGRESS",
      "This reply is already being sent.",
    );

  const ticketId = ticketOf(claimed);
  let messageId;
  try {
    ({ messageId } = await sendContactReplyEmail({
      to: claimed.email,
      name: claimed.name,
      ticketId,
      subject: claimed.subject,
      originalMessage: claimed.message,
      replyMessage: message,
    }));
  } catch (err) {
    logger.warn(
      { ticketId, code: err.code, status: err.status },
      "contact reply email failed",
    );
    await ContactMessage.updateOne(
      { _id: id, "replies.requestId": requestId },
      {
        $set: {
          "replies.$.state": "FAILED",
          "replies.$.error": String(err.code || "EMAIL_FAILED").slice(0, 80),
        },
      },
    ).catch((e) =>
      logger.error(
        { ticketId, requestId, message: e.message },
        "could not record failed reply",
      ),
    );
    // the query keeps its current status so the admin can retry
    throw err instanceof AppError
      ? err
      : new AppError(
          502,
          "EMAIL_FAILED",
          "The email could not be sent. The query is still unresolved; you can retry.",
        );
  }

  const finish = () =>
    ContactMessage.findOneAndUpdate(
      { _id: id, "replies.requestId": requestId },
      {
        $set: {
          "replies.$.state": "SENT",
          "replies.$.sentAt": new Date(),
          "replies.$.messageId": messageId || null,
          "replies.$.error": null,
          status: "RESOLVED",
          resolvedAt: new Date(),
        },
      },
      { new: true },
    )
      .select("-ip")
      .lean();
  let updated;
  try {
    updated = await finish();
  } catch {
    try {
      updated = await finish();
    } catch {
      updated = null;
    }
  }
  if (!updated) {
    // The email is out but the record could not be updated. The row stays SENDING, which blocks a duplicate of this exact reply.
    logger.error(
      { ticketId, requestId, messageId },
      "reply email was sent but saving its result failed",
    );
    throw new AppError(
      500,
      "REPLY_SAVE_FAILED",
      "The email was sent, but saving its status failed. Do not send it again; refresh this page.",
    );
  }
  return ok(res, "Reply sent and query resolved.", { query: full(updated) });
});
