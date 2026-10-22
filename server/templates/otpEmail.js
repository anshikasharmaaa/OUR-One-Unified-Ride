'use strict';
const COPY = {
  USER_VERIFY: { subject: 'Verify your email for OUR', heading: 'Verify your email', intro: 'Use this code to finish creating your OUR account.' },
  DRIVER_VERIFY: { subject: 'Verify your email for OUR Drivers', heading: 'Verify your email', intro: 'Use this code to confirm your driver registration request.' },
  PASSWORD_RESET: { subject: 'Reset your OUR password', heading: 'Reset your password', intro: 'Use this code to reset your OUR password.' },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function renderOtpEmail({ name, code, purpose, expiresInMinutes, logoUrl }) {
  const c = COPY[purpose];
  const greeting = name ? `Hi ${esc(name.split(' ')[0])},` : 'Hi,';
  const font = "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#eef3ff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3ff;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px 28px;font-family:${font};color:#0f1b3d;">
<tr><td style="padding-bottom:20px;"><img src="${esc(logoUrl)}" alt="OUR — One Unified Ride" width="200" style="display:block;height:auto;border:0;font-size:18px;font-weight:700;color:#1d4ed8;"></td></tr>
<tr><td style="font-size:22px;font-weight:700;padding-bottom:8px;">${esc(c.heading)}</td></tr>
<tr><td style="font-size:15px;line-height:22px;color:#41507a;padding-bottom:20px;">${greeting}<br>${esc(c.intro)}</td></tr>
<tr><td align="center" style="padding-bottom:20px;"><div style="display:inline-block;background:#eef3ff;border-radius:10px;padding:14px 22px;font-size:32px;font-weight:700;letter-spacing:10px;color:#1d4ed8;font-family:'SFMono-Regular',Consolas,monospace;">${esc(code)}</div></td></tr>
<tr><td style="font-size:14px;line-height:21px;color:#41507a;padding-bottom:16px;">This code expires in ${expiresInMinutes} minutes and can be used once.</td></tr>
<tr><td style="font-size:13px;line-height:20px;color:#6b7699;border-top:1px solid #e3e9f8;padding-top:16px;">Never share this code with anyone. OUR will never ask for it by phone, chat or email. If you didn't request it, you can safely ignore this message.</td></tr>
<tr><td style="font-size:12px;color:#8b95b5;padding-top:16px;">OUR — One Unified Ride · One Search, Infinite Choices</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${c.heading}\n\n${greeting}\n${c.intro}\n\nYour code: ${code}\n\nThis code expires in ${expiresInMinutes} minutes and can be used once.\nNever share this code with anyone. If you didn't request it, ignore this email.\n\nOUR — One Unified Ride`;
  return { subject: c.subject, html, text };
}
module.exports = { renderOtpEmail };
