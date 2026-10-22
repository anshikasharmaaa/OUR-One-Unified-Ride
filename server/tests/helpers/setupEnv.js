// Runs before every test file. Forces an isolated test database — a real .env can never leak in.
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';
const uri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/our_test';
const dbName = (uri.split('?')[0].split('/').pop() || '').trim();
if (!dbName.endsWith('_test')) {
  throw new Error(`Refusing to run tests: database name "${dbName}" must end with "_test".`);
}
process.env.TEST_MONGODB_URI = uri;
process.env.MONGODB_URI = uri;
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-0123456789-abcdefghijklmnop';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-0123456789-abcdefghijklmno';
process.env.OTP_SECRET = 'test-otp-secret-0123456789-abcdefghijklmnopqrs';
process.env.BCRYPT_ROUNDS = '4';
process.env.GOOGLE_CLIENT_ID = 'test-client.apps.googleusercontent.com';
process.env.SMTP_HOST = '';
process.env.ADMIN_EMAIL = '';
process.env.ADMIN_PASSWORD = '';
process.env.ADMIN_NAME = '';
// Some Mongo-compatible servers (e.g. FerretDB) don't implement partial/TTL indexes. Set SKIP_ADVANCED_INDEXES=false to test them on real MongoDB.
process.env.SKIP_ADVANCED_INDEXES = process.env.SKIP_ADVANCED_INDEXES || 'true';
