jest.mock('../services/email', () => require('./helpers/mailbox').emailModule);
const { agent, bearer, useDatabase, makeUser, makeDriver, loginUser, models, PASSWORD } = require('./helpers/testApp');
const { bootstrapAdmin } = require('../services/adminBootstrap');

useDatabase();
const ADMIN = { name: 'Platform Admin', email: 'admin@our.example', password: 'Adm1n!Very-Strong-Pass' };
const adminLogin = (ag, email = ADMIN.email, password = ADMIN.password) => ag.post('/api/admin/login').send({ email, password });

describe('admin bootstrap', () => {
  test('creates a hashed admin once, idempotently, and never resets an existing password', async () => {
    expect((await bootstrapAdmin(ADMIN)).created).toBe(true);
    const a = await models.User.findOne({ email: ADMIN.email }).select('+passwordHash');
    expect(a.role).toBe('ADMIN');
    expect(a.passwordHash).not.toContain(ADMIN.password);
    const before = a.passwordHash;
    expect((await bootstrapAdmin({ ...ADMIN, password: 'Different!Passw0rd-123' })).created).toBe(false);
    expect((await models.User.findOne({ email: ADMIN.email }).select('+passwordHash')).passwordHash).toBe(before);
    expect(await models.User.countDocuments({ role: 'ADMIN' })).toBe(1);
  });

  test('refuses weak, missing or colliding credentials', async () => {
    await expect(bootstrapAdmin({ ...ADMIN, password: 'short1!A' })).rejects.toThrow(/Invalid admin bootstrap/);
    await expect(bootstrapAdmin({ name: '', email: '', password: '' })).rejects.toThrow();
    await makeUser({ email: ADMIN.email });
    await expect(bootstrapAdmin(ADMIN)).rejects.toThrow(/non-admin/);
    expect(await models.User.countDocuments({ role: 'ADMIN' })).toBe(0);
  });
});

describe('admin authentication', () => {
  beforeEach(() => bootstrapAdmin(ADMIN));

  test('12. admin login succeeds only with the configured credentials', async () => {
    const ag = agent();
    const ok = await adminLogin(ag);
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.role).toBe('ADMIN');
    expect(ok.headers['set-cookie'][0]).not.toMatch(/Expires=/i); // admin = session cookie
    expect((await bearer(ag.get('/api/admin/me'), ok.body.data.accessToken)).status).toBe(200);
    expect((await adminLogin(agent(), ADMIN.email, 'Wrong!Passw0rd-123')).status).toBe(401);
    expect((await adminLogin(agent(), 'other@our.example')).status).toBe(401);
  });

  test('a regular user cannot use the admin login, and admins cannot use the public login', async () => {
    await makeUser();
    expect((await adminLogin(agent(), 'rider@example.com', PASSWORD)).status).toBe(401);
    expect((await loginUser(agent(), ADMIN.email, ADMIN.password)).status).toBe(401);
  });

  test('no public admin registration or recovery endpoints exist', async () => {
    const ag = agent();
    for (const path of ['register', 'signup', 'forgot-password', 'reset-password', 'verify-email', 'google']) {
      expect((await ag.post(`/api/admin/${path}`).send({ email: ADMIN.email })).status).toBe(404);
    }
    // the public reset flow ignores admin accounts entirely
    await ag.post('/api/auth/forgot-password').send({ email: ADMIN.email });
    await new Promise((r) => setTimeout(r, 150));
    expect(await models.Otp.countDocuments({ email: ADMIN.email })).toBe(0);
  });
});

describe('role separation', () => {
  test('10/11. users cannot reach admin or driver endpoints; 401 vs 403 are distinct', async () => {
    await makeUser();
    const ag = agent();
    const { body } = await loginUser(ag);
    const t = body.data.accessToken;
    expect((await ag.get('/api/admin/me')).status).toBe(401);
    expect((await bearer(ag.get('/api/admin/me'), t)).status).toBe(403);
    expect((await bearer(ag.get('/api/driver/me'), t)).status).toBe(403);
  });

  test('drivers and admins cannot use the user-only endpoint, and drivers cannot reach admin', async () => {
    await makeDriver();
    await bootstrapAdmin(ADMIN);
    const d = await agent().post('/api/driver/login').send({ email: 'driver@example.com', password: PASSWORD });
    const a = await adminLogin(agent());
    expect((await bearer(agent().get('/api/admin/me'), d.body.data.accessToken)).status).toBe(403);
    expect((await bearer(agent().get('/api/auth/me'), d.body.data.accessToken)).status).toBe(403);
    expect((await bearer(agent().get('/api/auth/me'), a.body.data.accessToken)).status).toBe(403);
    expect((await bearer(agent().get('/api/driver/me'), a.body.data.accessToken)).status).toBe(403);
  });

  test('a client-supplied role in any request body is rejected, never trusted', async () => {
    await makeUser();
    const res = await agent().post('/api/auth/login').send({ email: 'rider@example.com', password: PASSWORD, role: 'ADMIN' });
    expect(res.status).toBe(400);
  });
});
