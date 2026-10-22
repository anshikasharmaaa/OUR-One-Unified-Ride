jest.mock('../services/email', () => require('./helpers/mailbox').emailModule);
jest.mock('google-auth-library', () => {
  const verifyIdToken = jest.fn();
  return { OAuth2Client: jest.fn(() => ({ verifyIdToken })), __verify: verifyIdToken };
});
const { __verify: verifyIdToken } = require('google-auth-library');
const { agent, bearer, useDatabase, makeUser, loginUser, models, PASSWORD } = require('./helpers/testApp');
const { bootstrapAdmin } = require('../services/adminBootstrap');

useDatabase();
const TOKEN = 'a'.repeat(40);
const payload = (over = {}) => ({ getPayload: () => ({ sub: 'g-123', email: 'Asha@Gmail.com', email_verified: true, name: 'Asha Verma', ...over }) });
const google = (ag = agent(), credential = TOKEN) => ag.post('/api/auth/google').send({ credential });
beforeEach(() => verifyIdToken.mockReset());

describe('Google sign-in', () => {
  test('9. the ID token is verified against our client ID audience, then a verified user + session is created (no admin approval for normal users)', async () => {
    verifyIdToken.mockResolvedValue(payload());
    const ag = agent();
    const res = await google(ag);
    expect(res.status).toBe(200);
    expect(verifyIdToken).toHaveBeenCalledWith({ idToken: TOKEN, audience: 'test-client.apps.googleusercontent.com' });
    const u = await models.User.findOne({ googleSubject: 'g-123' });
    expect(u).toMatchObject({ email: 'asha@gmail.com', role: 'USER', emailVerified: true });
    expect((await bearer(ag.get('/api/auth/me'), res.body.data.accessToken)).status).toBe(200);
    // second sign-in reuses the same account
    await google();
    expect(await models.User.countDocuments()).toBe(1);
  });

  test('9. invalid tokens and unverified Google emails are rejected', async () => {
    verifyIdToken.mockRejectedValue(new Error('Wrong recipient'));
    expect((await google()).status).toBe(401);
    verifyIdToken.mockResolvedValue(payload({ email_verified: false }));
    expect((await google()).status).toBe(401);
    expect(await models.User.countDocuments()).toBe(0);
  });

  test('identity fields sent by the browser are rejected, not trusted', async () => {
    verifyIdToken.mockResolvedValue(payload());
    const res = await agent().post('/api/auth/google').send({ credential: TOKEN, email: 'admin@x.com', role: 'ADMIN' });
    expect(res.status).toBe(400);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  test('links a Google identity to an existing verified account with the same email', async () => {
    await makeUser({ email: 'asha@gmail.com' });
    verifyIdToken.mockResolvedValue(payload());
    expect((await google()).status).toBe(200);
    const u = await models.User.findOne({ email: 'asha@gmail.com' });
    expect(u.googleSubject).toBe('g-123');
    expect(await models.User.countDocuments()).toBe(1);
  });

  test('an unverified pre-registration cannot be used to take over a Google account', async () => {
    await makeUser({ email: 'asha@gmail.com', emailVerified: false }); // attacker signed up with the victim's email
    verifyIdToken.mockResolvedValue(payload());
    expect((await google()).status).toBe(200);
    expect((await loginUser(agent(), 'asha@gmail.com', PASSWORD)).status).toBe(401); // attacker's password is gone
  });

  test('refuses to link a different Google account to an already-linked email', async () => {
    await makeUser({ email: 'asha@gmail.com', googleSubject: 'someone-else' });
    verifyIdToken.mockResolvedValue(payload());
    expect((await google()).status).toBe(409);
  });

  test('cannot sign in to an admin account via Google, nor create one', async () => {
    await bootstrapAdmin({ name: 'Admin', email: 'asha@gmail.com', password: 'Adm1n!Very-Strong-Pass' });
    verifyIdToken.mockResolvedValue(payload());
    const res = await google();
    expect(res.status).toBe(403);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect((await models.User.findOne({ email: 'asha@gmail.com' })).googleSubject).toBeUndefined();
  });

  test('suspended accounts are blocked', async () => {
    await makeUser({ email: 'asha@gmail.com', status: 'SUSPENDED' });
    verifyIdToken.mockResolvedValue(payload());
    expect((await google()).status).toBe(403);
  });
});

describe('Google service without configuration', () => {
  test('fails honestly (503) instead of faking success when GOOGLE_CLIENT_ID is missing', async () => {
    const prev = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = '';
    jest.resetModules();
    const { verifyGoogleIdToken } = require('../services/google');
    await expect(verifyGoogleIdToken(TOKEN)).rejects.toMatchObject({ status: 503, code: 'GOOGLE_NOT_CONFIGURED' });
    process.env.GOOGLE_CLIENT_ID = prev;
  });
});
