const { renderOtpEmail } = require('../templates/otpEmail');

test('OTP email contains logo, code, expiry, warning and a plain-text fallback; escapes user input', () => {
  const m = renderOtpEmail({ name: '<b>Riya</b> Sharma', code: '123456', purpose: 'USER_VERIFY', expiresInMinutes: 10, logoUrl: 'https://cdn.example.com/logo.png' });
  expect(m.html).toContain('https://cdn.example.com/logo.png');
  expect(m.html).toContain('123456');
  expect(m.html).toMatch(/expires in 10 minutes/);
  expect(m.html).toMatch(/Never share this code/);
  expect(m.html).not.toContain('<b>Riya</b>');
  expect(m.text).toContain('123456');
  expect(renderOtpEmail({ code: '1', purpose: 'PASSWORD_RESET', expiresInMinutes: 10, logoUrl: 'x' }).subject).toMatch(/Reset/);
});
