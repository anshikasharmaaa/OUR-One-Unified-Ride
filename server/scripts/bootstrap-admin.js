'use strict';
// Usage: npm run bootstrap:admin   (reads ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from server/.env)
const env = require('../config/env');
const { connectDb, disconnectDb } = require('../config/db');
const { bootstrapAdmin } = require('../services/adminBootstrap');

(async () => {
  const { name, email, password } = env.admin;
  if (!name || !email || !password) {
    console.error('Missing ADMIN_NAME, ADMIN_EMAIL or ADMIN_PASSWORD in server/.env. No admin was created.');
    process.exit(1);
  }
  try {
    await connectDb();
    const { created } = await bootstrapAdmin({ name, email, password });
    console.log(created ? `Admin account created for ${email}.` : `Admin ${email} already exists — nothing changed.`);
    await disconnectDb();
  } catch (err) {
    console.error(`Bootstrap failed: ${err.message}`);
    process.exit(1);
  }
})();
