jest.mock('../services/email', () => require('./helpers/mailbox').emailModule);
const { agent, bearer, useDatabase, makeDriver, mailbox, models, PASSWORD } = require('./helpers/testApp');

useDatabase();
const body = (over = {}) => ({
  name: 'Dev Patel', email: 'driver@example.com', mobile: '+91 98765 43210', city: 'Indore', vehicleType: 'CAB',
  password: PASSWORD, confirmPassword: PASSWORD, ...over,
});
const login = (ag = agent()) => ag.post('/api/driver/login').send({ email: 'driver@example.com', password: PASSWORD });

describe('driver registration', () => {
  test('14. registration creates a PENDING application; verification still grants no access', async () => {
    const ag = agent();
    const r = await ag.post('/api/driver/register').send(body());
    expect(r.status).toBe(201);
    expect(r.headers['set-cookie']).toBeUndefined();
    expect(r.body.data.accessToken).toBeUndefined();
    const d = await models.Driver.findOne({ email: 'driver@example.com' });
    expect(d.approvalStatus).toBe('PENDING');
    expect(d.mobile).toBe('9876543210');
    expect(d.role).toBe('DRIVER');

    const code = await mailbox.waitForCode('driver@example.com', 'DRIVER_VERIFY');
    const v = await ag.post('/api/driver/verify-email').send({ email: 'driver@example.com', code });
    expect(v.status).toBe(200);
    expect(v.headers['set-cookie']).toBeUndefined();
    expect(v.body.data.accessToken).toBeUndefined();
    expect((await models.Driver.findOne({ email: 'driver@example.com' })).approvalStatus).toBe('PENDING');
    const l = await login();
    expect(l.status).toBe(403);
    expect(l.body.code).toBe('DRIVER_PENDING');
  });

  test('the client cannot choose approval status, role or verification', async () => {
    const r = await agent().post('/api/driver/register').send(body({ approvalStatus: 'APPROVED', emailVerified: true, role: 'ADMIN' }));
    expect(r.status).toBe(400);
    expect(await models.Driver.countDocuments()).toBe(0);
  });

  test('validates mobile numbers and prevents duplicates', async () => {
    const ag = agent();
    expect((await ag.post('/api/driver/register').send(body({ mobile: '12345' }))).status).toBe(400);
    expect((await ag.post('/api/driver/register').send(body({ mobile: '5876543210' }))).status).toBe(400);
    await makeDriver();
    expect((await ag.post('/api/driver/register').send(body())).status).toBe(409);
    expect((await ag.post('/api/driver/register').send(body({ email: 'new@example.com' }))).status).toBe(409); // same mobile
    expect((await ag.post('/api/driver/register').send(body({ email: 'new@example.com', mobile: '9123456780' }))).status).toBe(201);
  });
});

describe('driver login and approval states', () => {
  test('15/17. pending, rejected, suspended and unverified drivers get no session', async () => {
    const expectations = [
      ['PENDING', true, 'DRIVER_PENDING'],
      ['REJECTED', true, 'DRIVER_REJECTED'],
      ['SUSPENDED', true, 'DRIVER_SUSPENDED'],
      ['APPROVED', false, 'EMAIL_NOT_VERIFIED'],
    ];
    for (const [approvalStatus, emailVerified, code] of expectations) {
      await models.Driver.deleteMany({});
      await makeDriver({ approvalStatus, emailVerified });
      const res = await login();
      expect(res.status).toBe(403);
      expect(res.body.code).toBe(code);
      expect(res.headers['set-cookie']).toBeUndefined();
    }
  });

  test('wrong password is a generic 401 and never reveals the approval state', async () => {
    await makeDriver({ approvalStatus: 'REJECTED' });
    const res = await agent().post('/api/driver/login').send({ email: 'driver@example.com', password: 'Wrong!Passw0rd1' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  test('16. an approved driver can log in and reach the driver endpoint', async () => {
    await makeDriver();
    const ag = agent();
    const res = await login(ag);
    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual(expect.objectContaining({ role: 'DRIVER', approvalStatus: 'APPROVED' }));
    const me = await bearer(ag.get('/api/driver/me'), res.body.data.accessToken);
    expect(me.status).toBe(200);
    expect(me.body.data.user.passwordHash).toBeUndefined();
  });

  test('suspending an approved driver cuts off the existing access token immediately', async () => {
    const d = await makeDriver();
    const ag = agent();
    const res = await login(ag);
    await models.Driver.updateOne({ _id: d._id }, { approvalStatus: 'SUSPENDED' });
    const me = await bearer(ag.get('/api/driver/me'), res.body.data.accessToken);
    expect(me.status).toBe(403);
    expect(me.body.code).toBe('DRIVER_SUSPENDED');
  });
});
