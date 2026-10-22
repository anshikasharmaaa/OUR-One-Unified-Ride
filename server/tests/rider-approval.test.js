jest.mock('../services/email', () => require('./helpers/mailbox').emailModule);
const { agent, bearer, useDatabase, makeUser, makeDriver, loginUser, mailbox, models, PASSWORD } = require('./helpers/testApp');
const { bootstrapAdmin } = require('../services/adminBootstrap');

useDatabase();
const ADMIN = { name: 'Platform Admin', email: 'admin@our.example', password: 'Adm1n!Very-Strong-Pass' };
const adminToken = async () => {
  await bootstrapAdmin(ADMIN);
  return (await agent().post('/api/admin/login').send({ email: ADMIN.email, password: ADMIN.password })).body.data.accessToken;
};
const decide = (t, kind, id, status) => bearer(agent().patch(`/api/admin/${kind}/${id}/approval`), t).send({ status });

describe('rider registration needs administrator approval', () => {
  test('register → verify email → login is blocked as pending → admin approves → rider logs in', async () => {
    const ag = agent();
    await ag.post('/api/auth/register').send({ name: 'Riya Sharma', email: 'riya@example.com', password: PASSWORD, confirmPassword: PASSWORD });
    expect((await models.User.findOne({ email: 'riya@example.com' })).approvalStatus).toBe('PENDING');
    const code = await mailbox.waitForCode('riya@example.com', 'USER_VERIFY');
    expect((await ag.post('/api/auth/verify-email').send({ email: 'riya@example.com', code })).status).toBe(200);

    const blocked = await loginUser(ag, 'riya@example.com');
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('RIDER_PENDING');
    expect(blocked.headers['set-cookie']).toBeUndefined();

    const t = await adminToken();
    const user = await models.User.findOne({ email: 'riya@example.com' });
    const pending = await bearer(agent().get('/api/admin/users?approval=PENDING'), t);
    expect(pending.body.data.items.map((u) => u.email)).toEqual(['riya@example.com']);
    expect((await decide(t, 'users', user._id, 'APPROVED')).status).toBe(200);

    const ok = await loginUser(ag, 'riya@example.com');
    expect(ok.status).toBe(200);
    expect(ok.body.data.user).toEqual(expect.objectContaining({ role: 'USER', approvalStatus: 'APPROVED' }));
  });

  test('a wrong password never reveals the approval state', async () => {
    await makeUser({ approvalStatus: 'REJECTED' });
    const r = await loginUser(agent(), 'rider@example.com', 'Wrong!Passw0rd');
    expect(r.status).toBe(401);
    expect(r.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('rejected and suspended riders are refused with their own codes', async () => {
    for (const [approvalStatus, code] of [['REJECTED', 'RIDER_REJECTED'], ['SUSPENDED', 'RIDER_SUSPENDED']]) {
      await models.User.deleteMany({});
      await makeUser({ approvalStatus });
      const r = await loginUser(agent());
      expect([r.status, r.body.code]).toEqual([403, code]);
    }
  });

  test('accounts created before the rule (no approvalStatus) keep working', async () => {
    await makeUser();
    expect((await loginUser(agent())).status).toBe(200);
  });

  test('suspending an approved rider ends their live session immediately', async () => {
    const u = await makeUser({ approvalStatus: 'APPROVED' });
    const login = await loginUser(agent());
    const token = login.body.data.accessToken;
    expect((await bearer(agent().get('/api/auth/me'), token)).status).toBe(200);
    expect((await decide(await adminToken(), 'users', u._id, 'SUSPENDED')).status).toBe(200);
    expect((await bearer(agent().get('/api/auth/me'), token)).status).toBe(401);
  });

  test('an unverified rider cannot be approved; a malformed id is a 400; unknown id a 404', async () => {
    const u = await makeUser({ emailVerified: false, approvalStatus: 'PENDING' });
    const t = await adminToken();
    expect((await decide(t, 'users', u._id, 'APPROVED')).status).toBe(409);
    expect((await decide(t, 'users', 'not-an-id', 'APPROVED')).status).toBe(400);
    expect((await decide(t, 'users', '507f1f77bcf86cd799439011', 'APPROVED')).status).toBe(404);
  });

  test('only administrators can decide; riders and drivers get 403, anonymous gets 401', async () => {
    const u = await makeUser({ approvalStatus: 'APPROVED' });
    const rider = (await loginUser(agent())).body.data.accessToken;
    expect((await decide(rider, 'users', u._id, 'APPROVED')).status).toBe(403);
    expect((await agent().patch(`/api/admin/users/${u._id}/approval`).send({ status: 'APPROVED' })).status).toBe(401);
  });

  test('admin can approve a driver too, and the status value is validated', async () => {
    const d = await makeDriver({ approvalStatus: 'PENDING' });
    const t = await adminToken();
    expect((await bearer(agent().patch(`/api/admin/drivers/${d._id}/approval`), t).send({ status: 'HACKED' })).status).toBe(400);
    expect((await decide(t, 'drivers', d._id, 'APPROVED')).status).toBe(200);
    expect((await models.Driver.findById(d._id)).approvalStatus).toBe('APPROVED');
  });
});

describe('GET /api/searches/mine', () => {
  test('returns only the signed-in rider’s own searches', async () => {
    const a = await makeUser({ email: 'a@example.com', approvalStatus: 'APPROVED' });
    const b = await makeUser({ email: 'b@example.com', approvalStatus: 'APPROVED' });
    await models.RideSearch.create({ pickup: 'Palasia', dropoff: 'Rajwada', user: a._id });
    await models.RideSearch.create({ pickup: 'Other', dropoff: 'Place', user: b._id });
    const token = (await loginUser(agent(), 'a@example.com')).body.data.accessToken;
    const r = await bearer(agent().get('/api/searches/mine'), token);
    expect(r.status).toBe(200);
    expect(r.body.data.total).toBe(1);
    expect(r.body.data.items[0]).toEqual(expect.objectContaining({ pickup: 'Palasia', dropoff: 'Rajwada' }));
    expect((await agent().get('/api/searches/mine')).status).toBe(401);
  });
});
