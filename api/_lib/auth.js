import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'elizabeth_session';
const SESSION_SECONDS = 60 * 60 * 8;

function sign(value) {
  return createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('base64url');
}

function cookieOptions(req) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS * 1000,
  };
}

function issueSession(req, res) {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url');
  res.cookie(COOKIE_NAME, `${payload}.${sign(payload)}`, cookieOptions(req));
}

function verifySession(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || !process.env.SESSION_SECRET) return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function validOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    const originHost = new URL(origin).host;
    const requestHost = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export async function login(req, res) {
  if (!validOrigin(req)) return res.status(403).json({ error: 'Origen de solicitud no permitido.' });
  const { username, password } = req.body || {};
  const configuredUsername = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!configuredUsername || !passwordHash || !process.env.SESSION_SECRET) {
    return res.status(503).json({ error: 'El acceso todavía no está configurado en el servidor.' });
  }
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 120 || password.length > 1024) {
    return res.status(400).json({ error: 'Revisa el usuario y la contraseña.' });
  }
  const validUsername = username.trim().toLocaleLowerCase() === configuredUsername.trim().toLocaleLowerCase();
  const validPassword = await bcrypt.compare(password, passwordHash).catch(() => false);
  if (!validUsername || !validPassword) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  issueSession(req, res);
  return res.json({ authenticated: true });
}

export function logout(req, res) {
  if (!validOrigin(req)) return res.status(403).json({ error: 'Origen de solicitud no permitido.' });
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(req), maxAge: undefined });
  return res.status(204).end();
}

export function authStatus(req, res) {
  return res.json({ authenticated: verifySession(req) });
}

export function passwordHashConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_USERNAME && process.env.SESSION_SECRET && process.env.MONGODB_URI);
}

export function requireAuth(req, res, next) {
  if (!validOrigin(req)) return res.status(403).json({ error: 'Origen de solicitud no permitido.' });
  if (!verifySession(req)) return res.status(401).json({ error: 'La sesión expiró. Inicia sesión nuevamente.' });
  return next();
}
