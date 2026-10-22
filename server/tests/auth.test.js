jest.mock('../services/email', () => require('./helpers/mailbox').emailModule);
const { agent, csrf, bearer, useDatabase, makeUser, loginUser, mailbox, models, PASSWORD } = require('./helpers/testApp');
const { sendOtp } = require('../services/otp');
const { signAccessToken } = require('../services/tokens');

useDatabase();
const reg = (ag, over = {}) =>
  ag.post('/api/auth/register').send({ name: 'Riya Sharma', email: 'riya@example.com', password: PASSWORD, confirmPassword: PASSWORD, ...over });

describe('registration & email verification', () => {
  test('1. registration succeeds, stores only an OTP hash and never returns the code', async () => {
    const res = await reg(agent());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|"code"/);
    const code = await mailbox.waitForCode('riya@example.com', 'USER_VERIFY');
    const otp = await models.Otp.findOne({ email: 'riya@example.com' });
    expect(otp.codeHash).toHaveLength(64);
    expect(otp.codeHash).not.toContain(code);
    const user = await models.User.findOne({ email: 'riya@example.com' }).select('+passwordHash');
    expect(user.emailVerified).toBe(false);
    expect(user.passwordHash).not.toContain(PASSWORD);
  });

  test('2. duplicate registration of a verified email returns 409; an unverified one is replaced', async () => {
    await makeUser({ email: 'riya@example.com' });
    expect((await reg(agent())).status).toBe(409);
    await models.User.deleteMany({});
    expect((await reg(agent())).status).toBe(201);
    expect((await reg(agent(), { name: 'Riya S' })).status).toBe(201);
    expect(await models.User.countDocuments({ email: 'riya@example.com' })).toBe(1);
  });

  test('13. public signup cannot create an admin (or set any privileged field)', async () => {
    const res = await reg(agent(), { role: 'ADMIN', emailVerified: true });
    expect(res.status).toBe(400);
    expect(await models.User.countDocuments()).toBe(0);
    await reg(agent());
    const u = await models.User.findOne({ email: 'riya@example.com' });
    expect(u.role).toBe('USER');
    expect(u.emailVerified).toBe(false);
  });

  test('3. email verification succeeds with a valid OTP; login then works straight away (normal users need no approval)', async () => {
    const ag = agent();
    await reg(ag);
    const code = await mailbox.waitForCode('riya@example.com', 'USER_VERIFY');
    const v = await ag.post('/api/auth/verify-email').send({ email: 'riya@example.com', code });
    expect(v.status).toBe(200);
    const login = await loginUser(ag, 'riya@example.com');
    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeTruthy();
    expect(login.body.data.user).toEqual(expect.objectContaining({ role: 'USER', emailVerified: true }));
    expect(login.body.data.user.passwordHash).toBeUndefined();
  });

  test('4. expired OTP is rejected', async () => {
    const ag = agent();
    await reg(ag);
    const code = await mailbox.waitForCode('riya@example.com', 'USER_VERIFY');
    await models.Otp.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    const v = await ag.post('/api/auth/verify-email').send({ email: 'riya@example.com', code });
    expect(v.status).toBe(400);
    expect((await models.User.findOne({ email: 'riya@example.com' })).emailVerified).toBe(false);
  });

  test('5. wrong OTP is rejected and attempts are capped (even the right code fails afterwards)', async () => {
    const ag = agent();
    await reg(ag);
    const code = await mailbox.waitForCode('riya@example.com', 'USER_VERIFY');
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i += 1) {
      expect((await ag.post('/api/auth/verify-email').send({ email: 'riya@example.com', code: wrong })).status).toBe(400);
    }
    const v = await ag.post('/api/auth/verify-email').send({ email: 'riya@example.com', code });
    expect(v.status).toBe(400);
    expect((await models.User.findOne({ email: 'riya@example.com' })).emailVerified).toBe(false);
  });

  test('6. a consumed OTP cannot be reused', async () => {
    const ag = agent();
    await reg(ag);
    const code = await mailbox.waitForCode('riya@example.com', 'USER_VERIFY');
    expect((await ag.post('/api/auth/verify-email').send({ email: 'riya@example.com', code })).status).toBe(200);
    expect((await ag.post('/api/auth/verify-email').send({ email: 'riya@example.com', code })).status).toBe(400);
  });

  test('resend respects the 60s cooldown and replaces nothing early', async () => {
    const ag = agent();
    await reg(ag);
    await mailbox.waitForCode('riya@example.com', 'USER_VERIFY');
    const res = await ag.post('/api/auth/resend-verification').send({ email: 'riya@example.com' });
    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 150));
    expect(mailbox.sent).toHaveLength(1);
    await models.Otp.updateMany({}, { createdAt: new Date(Date.now() - 61000) });
    await ag.post('/api/auth/resend-verification').send({ email: 'riya@example.com' });
    await new Promise((r) => setTimeout(r, 200));
    expect(mailbox.sent).toHaveLength(2);
    expect(await models.Otp.countDocuments({ email: 'riya@example.com' })).toBe(1); // old code invalidated
  });

  test('23. invalid input gets 400 with field errors', async () => {
    const res = await reg(agent(), { email: 'not-an-email', password: 'weak', confirmPassword: 'other' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password']));
    expect((await agent().post('/api/auth/login').send({ email: { $ne: '' }, password: { $ne: '' } })).status).toBe(400);
  });
});

describe('login & protected access', () => {
  test('7. wrong password and unknown email give the same generic 401', async () => {
    await makeUser();
    const a = await loginUser(agent(), 'rider@example.com', 'Wrong!Passw0rd');
    const b = await loginUser(agent(), 'ghost@example.com', 'Wrong!Passw0rd');
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.message).toBe(b.body.message);
  });

  test('8. unverified users cannot log in or use a token', async () => {
    await makeUser({ emailVerified: false });
    const res = await loginUser(agent());
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    expect(res.headers['set-cookie']).toBeUndefined();

    const verified = await makeUser({ email: 'v@example.com' });
    const ag = agent();
    const ok = await loginUser(ag, 'v@example.com');
    await models.User.updateOne({ _id: verified._id }, { emailVerified: false });
    expect((await bearer(ag.get('/api/auth/me'), ok.body.data.accessToken)).status).toBe(403);
  });

  test('login sets an HttpOnly refresh cookie and /me works with the access token', async () => {
    await makeUser();
    const ag = agent();
    const res = await loginUser(ag);
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/our_rt=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/auth/);
    const me = await bearer(ag.get('/api/auth/me'), res.body.data.accessToken);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('rider@example.com');
  });

  test('22. missing, tampered and wrongly-signed tokens are rejected with 401', async () => {
    await makeUser();
    const ag = agent();
    const { body } = await loginUser(ag);
    const t = body.data.accessToken;
    expect((await ag.get('/api/auth/me')).status).toBe(401);
    expect((await bearer(ag.get('/api/auth/me'), `${t.slice(0, -3)}abc`)).status).toBe(401);
    const [h, , s] = t.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'x', role: 'ADMIN', fam: 'x', aud: 'access', iss: 'our-api' })).toString('base64url');
    expect((await bearer(ag.get('/api/admin/me'), `${h}.${forged}.${s}`)).status).toBe(401);
    expect((await bearer(ag.get('/api/auth/me'), 'garbage')).status).toBe(401);
  });

  test('a token for a suspended account stops working immediately', async () => {
    const u = await makeUser();
    const ag = agent();
    const { body } = await loginUser(ag);
    await models.User.updateOne({ _id: u._id }, { status: 'SUSPENDED' });
    expect((await bearer(ag.get('/api/auth/me'), body.data.accessToken)).status).toBe(403);
  });
});

describe('forgot / reset password', () => {
  test('18. forgot-password does not disclose whether an account exists', async () => {
    await makeUser();
    const known = await agent().post('/api/auth/forgot-password').send({ email: 'rider@example.com' });
    const unknown = await agent().post('/api/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(unknown.body).toEqual({ ...known.body, data: { ...known.body.data, email: 'nobody@example.com' } });
    await mailbox.waitForCode('rider@example.com', 'PASSWORD_RESET');
    expect(mailbox.sent.filter((m) => m.to === 'nobody@example.com')).toHaveLength(0);
  });

  test('19. reset OTPs and verification OTPs are not interchangeable', async () => {
    const ag = agent();
    await reg(ag);
    const verifyCode = await mailbox.waitForCode('riya@example.com', 'USER_VERIFY');
    await sendOtp({ email: 'riya@example.com', purpose: 'PASSWORD_RESET', name: 'Riya' });
    const resetCode = await mailbox.waitForCode('riya@example.com', 'PASSWORD_RESET');
    expect((await ag.post('/api/auth/verify-email').send({ email: 'riya@example.com', code: resetCode })).status).toBe(400);
    await models.User.updateOne({ email: 'riya@example.com' }, { emailVerified: true });
    expect((await ag.post('/api/auth/verify-reset-otp').send({ email: 'riya@example.com', code: verifyCode })).status).toBe(400);
  });

  test('20. password reset changes the password, revokes sessions and tokens are single-use', async () => {
    await makeUser();
    const ag = agent();
    const first = await loginUser(ag);
    expect(first.status).toBe(200);
    await ag.post('/api/auth/forgot-password').send({ email: 'rider@example.com' });
    const code = await mailbox.waitForCode('rider@example.com', 'PASSWORD_RESET');
    const v = await ag.post('/api/auth/verify-reset-otp').send({ email: 'rider@example.com', code });
    expect(v.status).toBe(200);
    expect((await ag.post('/api/auth/verify-reset-otp').send({ email: 'rider@example.com', code })).status).toBe(400);
    const { resetToken } = v.body.data;
    const newPw = 'N3w!Passw0rdXyz';
    const r = await ag.post('/api/auth/reset-password').send({ resetToken, password: newPw, confirmPassword: newPw });
    expect(r.status).toBe(200);
    expect((await loginUser(agent(), 'rider@example.com', PASSWORD)).status).toBe(401);
    expect((await loginUser(agent(), 'rider@example.com', newPw)).status).toBe(200);
    // the earlier session is dead, and the reset token cannot be replayed
    expect((await bearer(ag.get('/api/auth/me'), first.body.data.accessToken)).status).toBe(401);
    const replay = await ag.post('/api/auth/reset-password').send({ resetToken, password: 'An0ther!Passw0rd', confirmPassword: 'An0ther!Passw0rd' });
    expect(replay.status).toBe(400);
  });

  test('an access token cannot be used as a reset token', async () => {
    await makeUser();
    const { body } = await loginUser(agent());
    const r = await agent().post('/api/auth/reset-password').send({ resetToken: body.data.accessToken, password: 'N3w!Passw0rdXyz', confirmPassword: 'N3w!Passw0rdXyz' });
    expect(r.status).toBe(400);
  });
});

describe('sessions', () => {
  test('24. refresh rotates the token; replaying the old one revokes the whole family', async () => {
    await makeUser();
    const ag = agent();
    const login = await loginUser(ag);
    const oldCookie = login.headers['set-cookie'][0].split(';')[0];
    const r1 = await csrf(ag.post('/api/auth/refresh'));
    expect(r1.status).toBe(200);
    const newCookie = r1.headers['set-cookie'][0].split(';')[0];
    expect(newCookie).not.toBe(oldCookie);
    expect((await bearer(agent().get('/api/auth/me'), r1.body.data.accessToken)).status).toBe(200);

    // immediate replay of the rotated token = concurrent-tab race: refused, but the family survives
    const race = await csrf(agent().post('/api/auth/refresh').set('Cookie', oldCookie));
    expect(race.status).toBe(401);
    expect(race.body.code).toBe('REFRESH_RACE');
    expect((await csrf(ag.post('/api/auth/refresh'))).status).toBe(200);

    // replay after the grace window = theft signal: everything in the family dies
    await models.Session.updateMany({ rotatedAt: { $ne: null } }, { rotatedAt: new Date(Date.now() - 60000) });
    const reuse = await csrf(agent().post('/api/auth/refresh').set('Cookie', oldCookie));
    expect(reuse.body.code).toBe('REFRESH_REUSED');
    expect(await models.Session.countDocuments({ revokedAt: null })).toBe(0);
    expect((await csrf(ag.post('/api/auth/refresh'))).status).toBe(401);
  });

  test('refresh/logout require a trusted Origin + header (CSRF guard)', async () => {
    await makeUser();
    const ag = agent();
    await loginUser(ag);
    expect((await ag.post('/api/auth/refresh')).status).toBe(403);
    expect((await ag.post('/api/auth/refresh').set('Origin', 'https://evil.example').set('X-Requested-With', 'OUR')).status).toBe(403);
    expect((await ag.post('/api/auth/logout')).status).toBe(403);
  });

  test('21. logout revokes the session: refresh and the old access token both stop working', async () => {
    await makeUser();
    const ag = agent();
    const login = await loginUser(ag);
    expect((await csrf(ag.post('/api/auth/logout'))).status).toBe(200);
    expect((await csrf(ag.post('/api/auth/refresh'))).status).toBe(401);
    expect((await bearer(agent().get('/api/auth/me'), login.body.data.accessToken)).status).toBe(401);
    expect(await models.Session.countDocuments({ revokedAt: null })).toBe(0);
  });

  test('a session cookie is used when "remember me" is off', async () => {
    await makeUser();
    const off = await loginUser(agent(), 'rider@example.com', PASSWORD, { rememberMe: false });
    const on = await loginUser(agent(), 'rider@example.com', PASSWORD, { rememberMe: true });
    expect(off.headers['set-cookie'][0]).not.toMatch(/Expires=/i);
    expect(on.headers['set-cookie'][0]).toMatch(/Expires=/i);
  });

  test('health endpoint and unknown routes behave', async () => {
    const h = await agent().get('/api/health');
    expect(h.status).toBe(200);
    const nf = await agent().get('/api/nope');
    expect(nf.status).toBe(404);
    expect(nf.body.success).toBe(false);
    expect(JSON.stringify(nf.body)).not.toMatch(/stack/);
  });
});

test('access tokens signed for another family are rejected', async () => {
  const u = await makeUser();
  const tok = signAccessToken({ sub: String(u._id), role: 'USER', fam: 'no-such-family' });
  expect((await bearer(agent().get('/api/auth/me'), tok)).status).toBe(401);
});
