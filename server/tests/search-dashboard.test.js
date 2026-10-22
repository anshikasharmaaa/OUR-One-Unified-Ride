jest.mock('../services/email', () => require('./helpers/mailbox').emailModule);
const { agent, bearer, useDatabase, makeUser, makeDriver, loginUser, models, PASSWORD } = require('./helpers/testApp');
const { bootstrapAdmin } = require('../services/adminBootstrap');

useDatabase();
const ADMIN = { name: 'Platform Admin', email: 'admin@our.example', password: 'Adm1n!Very-Strong-Pass' };
const body = (o = {}) => ({ pickup: 'Vijay Nagar, Indore', dropoff: 'Bhopal Railway Station', ...o });
const adminToken = async () => {
  await bootstrapAdmin(ADMIN);
  const r = await agent().post('/api/admin/login').send({ email: ADMIN.email, password: ADMIN.password });
  return r.body.data.accessToken;
};
const ENDPOINTS = ['stats', 'users', 'drivers', 'searches', 'analytics'];

describe('POST /api/searches', () => {
  test('records an anonymous search and honestly reports that comparison is unavailable', async () => {
    const res = await agent().post('/api/searches').send(body({ vehicleType: 'BIKE' }));
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(expect.objectContaining({ status: 'RECEIVED', comparisonAvailable: false }));
    expect(Object.keys(res.body.data).sort()).toEqual(['comparisonAvailable', 'id', 'status']); // no fares or results are invented
    const doc = await models.RideSearch.findOne({});
    expect(doc).toMatchObject({ pickup: 'Vijay Nagar, Indore', vehicleType: 'BIKE', user: null });
  });

  test('attributes the search to a signed-in rider; a bad token just stays anonymous', async () => {
    const u = await makeUser();
    const { body: login } = await loginUser(agent());
    await bearer(agent().post('/api/searches'), login.data.accessToken).send(body());
    await bearer(agent().post('/api/searches'), 'tampered.token.value').send(body());
    const docs = await models.RideSearch.find({}).sort({ createdAt: 1 });
    expect(docs).toHaveLength(2);
    expect(String(docs.find((d) => d.user)?.user)).toBe(String(u._id));
    expect(docs.filter((d) => !d.user)).toHaveLength(1);
  });

  test('validates input strictly (length, identical places, vehicle enum, unknown fields)', async () => {
    const ag = agent();
    expect((await ag.post('/api/searches').send(body({ pickup: 'ab' }))).status).toBe(400);
    expect((await ag.post('/api/searches').send(body({ dropoff: 'vijay nagar, indore' }))).status).toBe(400);
    expect((await ag.post('/api/searches').send(body({ vehicleType: 'HELICOPTER' }))).status).toBe(400);
    expect((await ag.post('/api/searches').send(body({ user: 'x', status: 'DONE' }))).status).toBe(400);
    expect((await ag.post('/api/searches').send(body({ pickup: { $ne: '' } }))).status).toBe(400);
    expect(await models.RideSearch.countDocuments()).toBe(0);
  });
});

describe('admin dashboard APIs', () => {
  test.each(ENDPOINTS)('GET /api/admin/%s requires authentication (401) and the ADMIN role (403)', async (name) => {
    expect((await agent().get(`/api/admin/${name}`)).status).toBe(401);
    await makeUser();
    const rider = await loginUser(agent());
    expect((await bearer(agent().get(`/api/admin/${name}`), rider.body.data.accessToken)).status).toBe(403);
    await makeDriver();
    const d = await agent().post('/api/driver/login').send({ email: 'driver@example.com', password: PASSWORD });
    expect((await bearer(agent().get(`/api/admin/${name}`), d.body.data.accessToken)).status).toBe(403);
  });

  test('stats are computed from real records (admins excluded, comparisons reported unavailable)', async () => {
    await makeUser({ email: 'a@example.com' });
    await makeUser({ email: 'b@example.com', emailVerified: false });
    await makeDriver({ email: 'd1@example.com', mobile: '9000000001', approvalStatus: 'PENDING' });
    await makeDriver({ email: 'd2@example.com', mobile: '9000000002', approvalStatus: 'APPROVED' });
    await makeDriver({ email: 'd3@example.com', mobile: '9000000003', approvalStatus: 'REJECTED', emailVerified: false });
    await agent().post('/api/searches').send(body());
    await models.RideSearch.create({ pickup: 'Old place', dropoff: 'Other place', createdAt: new Date(Date.now() - 30 * 86400000) });
    const t = await adminToken();
    const r = await bearer(agent().get('/api/admin/stats'), t);
    expect(r.status).toBe(200);
    expect(r.body.data.users).toEqual({ total: 2, verified: 1, last7Days: 2, pending: 0, approved: 2, rejected: 0, suspended: 0 });
    expect(r.body.data.drivers).toEqual({ total: 3, emailVerified: 2, pending: 1, approved: 1, rejected: 1, suspended: 0 });
    expect(r.body.data.searches).toEqual({ total: 2, last7Days: 1, last24Hours: 1 });
    expect(r.body.data.comparisons).toEqual({ available: false });
  });

  test('users list: paginated, newest first, riders only, no secrets', async () => {
    for (let i = 0; i < 3; i += 1) await makeUser({ email: `u${i}@example.com`, name: `Rider ${i}X` });
    const t = await adminToken();
    const r = await bearer(agent().get('/api/admin/users?limit=2&page=1'), t);
    expect(r.body.data).toEqual(expect.objectContaining({ total: 3, page: 1, limit: 2 }));
    expect(r.body.data.items).toHaveLength(2);
    expect(r.body.data.items.some((u) => u.email === ADMIN.email)).toBe(false);
    expect(JSON.stringify(r.body)).not.toMatch(/passwordHash|googleSubject|\$2[aby]\$/);
    expect(r.body.data.items[0].signInMethods).toEqual(['Email']);
    const p2 = await bearer(agent().get('/api/admin/users?limit=2&page=2'), t);
    expect(p2.body.data.items).toHaveLength(1);
  });

  test('drivers and searches lists return safe, explicit fields', async () => {
    const u = await makeUser();
    await makeDriver();
    await models.RideSearch.create({ pickup: 'Palasia', dropoff: 'Airport', vehicleType: 'AUTO', user: u._id });
    const t = await adminToken();
    const d = await bearer(agent().get('/api/admin/drivers'), t);
    expect(d.body.data.items[0]).toEqual(expect.objectContaining({ email: 'driver@example.com', mobile: '9876543210', approvalStatus: 'APPROVED' }));
    expect(JSON.stringify(d.body)).not.toMatch(/passwordHash/);
    const s = await bearer(agent().get('/api/admin/searches'), t);
    expect(s.body.data.items[0]).toEqual(expect.objectContaining({ pickup: 'Palasia', vehicleType: 'AUTO', user: { name: 'Riya Sharma', email: 'rider@example.com' } }));
  });

  test('rejects out-of-range or unknown query parameters', async () => {
    const t = await adminToken();
    expect((await bearer(agent().get('/api/admin/users?limit=500'), t)).status).toBe(400);
    expect((await bearer(agent().get('/api/admin/users?page=0'), t)).status).toBe(400);
    expect((await bearer(agent().get('/api/admin/users?sort=password'), t)).status).toBe(400);
    expect((await bearer(agent().get('/api/admin/analytics?days=365'), t)).status).toBe(400);
  });

  test('analytics returns per-day counts that add up to the real totals', async () => {
    await makeUser();
    await makeDriver();
    await agent().post('/api/searches').send(body());
    await agent().post('/api/searches').send(body({ pickup: 'Rajwada' }));
    const t = await adminToken();
    const r = await bearer(agent().get('/api/admin/analytics?days=7'), t);
    const { days, users, drivers, searches } = r.body.data;
    expect(days).toHaveLength(7);
    expect([users, drivers, searches].every((a) => a.length === 7)).toBe(true);
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    expect([sum(users), sum(drivers), sum(searches)]).toEqual([1, 1, 2]);
  });
});
