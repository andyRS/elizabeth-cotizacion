import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const password = randomBytes(32).toString('base64url');
const username = `test-${randomBytes(4).toString('hex')}`;
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/auth-tests-only';
process.env.ADMIN_USERNAME = username;
process.env.ADMIN_PASSWORD_HASH = await bcrypt.hash(password, 4);
process.env.SESSION_SECRET = randomBytes(48).toString('base64url');
process.env.NODE_ENV = 'test';

const { default: app } = await import('../_lib/app.js');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint reports configuration without exposing secrets', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, authConfigured: true });
});

test('anonymous sessions are rejected from data routes', async () => {
  const response = await fetch(`${baseUrl}/api/quotes`);
  assert.equal(response.status, 401);
});

test('login sets an HttpOnly session cookie and session endpoint validates it', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ username, password }),
  });
  assert.equal(response.status, 200);
  const cookies = response.headers.getSetCookie();
  const cookie = cookies.find((value) => value.startsWith('elizabeth_session='));
  assert.ok(cookie);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Strict/i);
  assert.doesNotMatch(cookie, /Secure/i);
  const token = cookie.split(';', 1)[0];
  const session = await fetch(`${baseUrl}/api/auth/session`, { headers: { Cookie: token } });
  assert.deepEqual(await session.json(), { authenticated: true });
});

test('wrong credentials are denied', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ username, password: `${password}-wrong` }),
  });
  assert.equal(response.status, 401);
});
