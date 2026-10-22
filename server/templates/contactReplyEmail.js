"use strict";
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const oneLine = (s) =>
  String(s)
    .replace(/[\r\n]+/g, " ")
    .trim();
const paragraphs = (s) =>
  esc(s)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

/** Every user- or admin-supplied string is escaped before it enters the HTML. */
function renderContactReplyEmail({
  name,
  ticketId,
  subject,
  originalMessage,
  replyMessage,
  logoSrc,
  supportEmail,
  siteUrl,
}) {
  const first = (name || "").trim().split(/\s+/)[0];
  const greeting = first ? `Hi ${esc(first)},` : "Hi,";
  const font = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const quoted =
    originalMessage.length > 400
      ? `${originalMessage.slice(0, 400)}…`
      : originalMessage;
  const support = supportEmail
    ? `Questions? Reply to this email or write to <a href="mailto:${esc(supportEmail)}" style="color:#1d4ed8;">${esc(supportEmail)}</a>.`
    : "Questions? Just reply to this email.";
  const mailSubject = `Re: ${oneLine(subject)} [${ticketId}]`;

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#eef3ff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3ff;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;font-family:${font};color:#0f1b3d;">
<tr><td style="padding:28px 28px 8px;"><img src="${esc(logoSrc)}" alt="OUR — One Unified Ride" width="180" style="display:block;height:auto;border:0;font-size:18px;font-weight:700;color:#1d4ed8;"></td></tr>
<tr><td style="padding:8px 28px 0;font-size:13px;color:#6b7699;">Reference <strong style="color:#0f1b3d;">${esc(ticketId)}</strong> · ${esc(oneLine(subject))}</td></tr>
<tr><td style="padding:18px 28px 0;font-size:15px;line-height:23px;">${greeting}<br>Thanks for writing to OUR. Here is our reply:</td></tr>
<tr><td style="padding:14px 28px 0;"><div style="background:#f3f6ff;border-left:4px solid #1d4ed8;border-radius:8px;padding:16px 18px;font-size:15px;line-height:23px;">${paragraphs(replyMessage)}</div></td></tr>
<tr><td style="padding:18px 28px 0;font-size:12px;color:#6b7699;line-height:18px;">Your original message:<br><em>${esc(quoted).replace(/\n/g, "<br>")}</em></td></tr>
<tr><td style="padding:18px 28px 0;font-size:15px;line-height:23px;">Warm regards,<br><strong>The OUR Support Team</strong></td></tr>
<tr><td style="padding:20px 28px 28px;"><div style="border-top:1px solid #e3e9f8;padding-top:14px;font-size:12px;line-height:19px;color:#6b7699;">${support}<br>OUR — One Unified Ride · <a href="${esc(siteUrl)}" style="color:#6b7699;">${esc(siteUrl.replace(/^https?:\/\//, ""))}</a></div></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `${first ? `Hi ${first},` : "Hi,"}`,
    "",
    `Reference ${ticketId} - ${oneLine(subject)}`,
    "Thanks for writing to OUR. Here is our reply:",
    "",
    replyMessage,
    "",
    "Your original message:",
    quoted,
    "",
    "Warm regards,",
    "The OUR Support Team",
    "",
    supportEmail
      ? `Questions? Reply to this email or write to ${supportEmail}.`
      : "Questions? Just reply to this email.",
    `OUR - One Unified Ride - ${siteUrl}`,
  ].join("\n");

  return { subject: mailSubject, html, text };
}
module.exports = { renderContactReplyEmail };
