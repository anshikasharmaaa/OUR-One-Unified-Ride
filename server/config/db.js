'use strict';
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');
const models = require('../models');

mongoose.set('strictQuery', true);

async function connectDb() {
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  } catch (err) {
    logger.error({ name: err.name, code: err.code }, 'MongoDB connection failed. Check MONGODB_URI, database user and Atlas IP access list.');
    throw err;
  }
  // Build indexes explicitly so unique constraints exist before traffic arrives.
  await Promise.all(Object.values(models).map((m) => m.init()));
  logger.info('MongoDB connected and indexes ready');
}

const disconnectDb = () => mongoose.disconnect();
module.exports = { connectDb, disconnectDb };
