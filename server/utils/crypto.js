'use strict';
const crypto = require('crypto');

const hmac = (secret, value) => crypto.createHmac('sha256', secret).update(String(value)).digest('hex');
const randomToken = (bytes = 48) => crypto.randomBytes(bytes).toString('base64url');
const randomOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
const safeEqualHex = (a, b) => {
  const x = Buffer.from(String(a), 'hex');
  const y = Buffer.from(String(b), 'hex');
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
};
module.exports = { hmac, randomToken, randomOtp, safeEqualHex, uuid: () => crypto.randomUUID() };
