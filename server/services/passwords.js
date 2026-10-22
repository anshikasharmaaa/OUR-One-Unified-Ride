'use strict';
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { hmac } = require('../utils/crypto');

const hashPassword = (plain) => bcrypt.hash(plain, env.bcryptRounds);
// Compared against when the account doesn't exist, so response timing doesn't reveal it.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-OUR', env.bcryptRounds);

async function verifyPassword(plain, hash) {
  const ok = await bcrypt.compare(plain, hash || DUMMY_HASH);
  return Boolean(hash) && ok;
}
const passwordVersion = (hash) => hmac(env.accessTokenSecret, `pwv:${hash || 'none'}`).slice(0, 24);

module.exports = { hashPassword, verifyPassword, passwordVersion };
