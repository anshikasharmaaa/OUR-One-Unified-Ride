import { signupSchema, driverSchema } from './validators';

const ok = { name: 'Riya Sharma', email: 'riya@example.com', password: 'Str0ng!Passw0rd', confirmPassword: 'Str0ng!Passw0rd' };

test('signup schema accepts a valid payload and flags weak passwords and mismatches', () => {
  expect(signupSchema.safeParse(ok).success).toBe(true);
  expect(signupSchema.safeParse({ ...ok, password: 'weakpass', confirmPassword: 'weakpass' }).success).toBe(false);
  const mismatch = signupSchema.safeParse({ ...ok, confirmPassword: 'Different1!' });
  expect(mismatch.error.issues[0].path).toEqual(['confirmPassword']);
});

test('driver schema validates Indian mobile numbers in common formats', () => {
  const base = { ...ok, mobile: '', city: 'Indore', vehicleType: 'CAB' };
  for (const good of ['9876543210', '+91 98765 43210', '098765-43210']) expect(driverSchema.safeParse({ ...base, mobile: good }).success).toBe(true);
  for (const bad of ['1234567890', '98765', 'abcdefghij']) expect(driverSchema.safeParse({ ...base, mobile: bad }).success).toBe(false);
  expect(driverSchema.safeParse({ ...base, mobile: '9876543210', vehicleType: '' }).success).toBe(false);
});
