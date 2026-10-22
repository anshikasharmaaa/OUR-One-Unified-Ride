const request = require('supertest');
const app = require('../../app');
const { connectDb, disconnectDb } = require('../../config/db');
const models = require('../../models');
const mailbox = require('./mailbox');
const { hashPassword } = require('../../services/passwords');

const ORIGIN = 'http://localhost:5173';
const PASSWORD = 'Str0ng!Passw0rd';

function useDatabase() {
  beforeAll(connectDb);
  beforeEach(async () => {
    mailbox.reset();
    await Promise.all(Object.values(models).map((m) => m.deleteMany({})));
  });
  afterAll(disconnectDb);
}

const agent = () => request.agent(app);
const csrf = (req) => req.set('Origin', ORIGIN).set('X-Requested-With', 'OUR');
const bearer = (req, token) => req.set('Authorization', `Bearer ${token}`);

async function makeUser({ email = 'rider@example.com', name = 'Riya Sharma', password = PASSWORD, ...rest } = {}) {
  return models.User.create({ name, email, passwordHash: await hashPassword(password), emailVerified: true, ...rest });
}
async function makeDriver(over = {}) {
  return models.Driver.create({
    name: 'Dev Patel', email: 'driver@example.com', mobile: '9876543210', city: 'Indore', vehicleType: 'CAB',
    passwordHash: await hashPassword(PASSWORD), emailVerified: true, approvalStatus: 'APPROVED', ...over,
  });
}
async function loginUser(ag, email = 'rider@example.com', password = PASSWORD, extra = {}) {
  const res = await ag.post('/api/auth/login').send({ email, password, ...extra });
  return res;
}

module.exports = { app, request, agent, csrf, bearer, useDatabase, makeUser, makeDriver, loginUser, mailbox, models, ORIGIN, PASSWORD };
