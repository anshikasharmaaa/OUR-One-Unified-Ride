'use strict';
// Operator-only recovery (no public endpoint exists). Run on a trusted machine with database access:
//   NEW_ADMIN_PASSWORD='...' npm run admin:reset-password -- --confirm
// Resets the password of ADMIN_EMAIL and revokes all of that admin's sessions.
const env = require('../config/env');
const { connectDb, disconnectDb } = require('../config/db');
const { User } = require('../models');
const { hashPassword } = require('../services/passwords');
const { revokeAllForAccount } = require('../services/sessions');
const { strongPassword } = require('../validators/schemas');

(async () => {
  if (!process.argv.includes('--confirm')) {
    console.error('Refusing to run without --confirm.');
    process.exit(1);
  }
  const email = (env.admin.email || '').toLowerCase();
  const parsed = strongPassword(12).safeParse(process.env.NEW_ADMIN_PASSWORD || '');
  if (!email || !parsed.success) {
    console.error('Set ADMIN_EMAIL in .env and NEW_ADMIN_PASSWORD (12+ chars, upper, lower, number, symbol) in the environment.');
    process.exit(1);
  }
  try {
    await connectDb();
    const admin = await User.findOne({ email, role: 'ADMIN' });
    if (!admin) throw new Error('No admin with that ADMIN_EMAIL.');
    admin.passwordHash = await hashPassword(parsed.data);
    await admin.save();
    await revokeAllForAccount(admin);
    console.log('Admin password reset and all admin sessions revoked.');
    await disconnectDb();
  } catch (err) {
    console.error(`Reset failed: ${err.message}`);
    process.exit(1);
  }
})();
