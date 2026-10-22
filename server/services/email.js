"use strict";
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const env = require("../config/env");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");
const { renderOtpEmail } = require("../templates/otpEmail");
const { renderContactReplyEmail } = require("../templates/contactReplyEmail");

let transporter;
function getTransporter() {
  const { host, port, secure, user, pass } = env.smtp;
  if (!host || !user || !pass) return null;
  if (!transporter)
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  return transporter;
}

async function sendOtpEmail({ to, name, code, purpose, expiresInMinutes }) {
  const t = getTransporter();
  if (!t)
    throw new AppError(
      503,
      "EMAIL_NOT_CONFIGURED",
      "Email delivery is not configured on the server yet.",
    );
  const { subject, html, text } = renderOtpEmail({
    name,
    code,
    purpose,
    expiresInMinutes,
    logoUrl: env.emailLogoUrl,
  });
  await t.sendMail({ from: env.emailFrom, to, subject, html, text });
}

let warnedLogo = false;
/** Prefer an inline (CID) logo from a server file; otherwise the public URL. localhost URLs cannot load in a recipient's inbox. */
function logoFor() {
  if (env.emailLogoPath && fs.existsSync(env.emailLogoPath)) {
    return {
      src: "cid:our-logo",
      attachments: [
        {
          filename: `our-logo${path.extname(env.emailLogoPath)}`,
          path: env.emailLogoPath,
          cid: "our-logo",
        },
      ],
    };
  }
  if (
    !warnedLogo &&
    /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/i.test(env.emailLogoUrl)
  ) {
    warnedLogo = true;
    logger.warn(
      "EMAIL_LOGO_URL points to localhost, so recipients cannot see the logo. Set a public https EMAIL_LOGO_URL or EMAIL_LOGO_PATH.",
    );
  }
  return { src: env.emailLogoUrl, attachments: [] };
}

/** Resolves only when the SMTP server ACCEPTED the message. Throws otherwise. Never pretends. */
async function sendContactReplyEmail({
  to,
  name,
  ticketId,
  subject,
  originalMessage,
  replyMessage,
}) {
  const t = getTransporter();
  if (!t)
    throw new AppError(
      503,
      "EMAIL_NOT_CONFIGURED",
      "Email delivery is not configured on the server yet. Set the SMTP_* variables.",
    );
  const logo = logoFor();
  const mail = renderContactReplyEmail({
    name,
    ticketId,
    subject,
    originalMessage,
    replyMessage,
    logoSrc: logo.src,
    supportEmail: env.supportEmail,
    siteUrl: env.clientOrigin,
  });
  const info = await t.sendMail({
    from: env.emailFrom,
    to,
    replyTo: env.supportEmail || undefined,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    attachments: logo.attachments,
  });
  if (!info?.accepted?.length)
    throw new AppError(
      502,
      "EMAIL_REJECTED",
      "The mail server did not accept the message.",
    );
  return { messageId: info.messageId };
}

module.exports = { sendOtpEmail, sendContactReplyEmail };
