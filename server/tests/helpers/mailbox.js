// In-memory stand-in for services/email.js. No real email is ever sent in tests.
const sent = [];
const replies = [];
let failReply = null;
const emailModule = {
  sendOtpEmail: async ({ to, code, purpose }) => {
    sent.push({ to, purpose, code });
  },
  sendContactReplyEmail: async (args) => {
    if (failReply) {
      const e = failReply;
      failReply = null;
      throw e;
    }
    replies.push(args);
    return { messageId: `<test-${replies.length}@our.example>` };
  },
};
const latest = (email, purpose) =>
  [...sent].reverse().find((m) => m.to === email && m.purpose === purpose)
    ?.code;
async function waitForCode(email, purpose, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const c = latest(email, purpose);
    if (c) return c;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error(`No ${purpose} email captured for ${email}`);
}
const failNextReply = (
  err = Object.assign(new Error("smtp down"), { code: "ECONNECTION" }),
) => {
  failReply = err;
};
const reset = () => {
  sent.length = 0;
  replies.length = 0;
  failReply = null;
};
module.exports = {
  sent,
  replies,
  emailModule,
  latest,
  waitForCode,
  failNextReply,
  reset,
};
