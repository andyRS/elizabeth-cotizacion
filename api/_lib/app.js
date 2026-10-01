import express from 'express';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { connectDatabase } from './db.js';
import { Client, Quote, Settings } from './models.js';
import { authStatus, login, logout, passwordHashConfigured, requireAuth } from './auth.js';
import { DEFAULT_SETTINGS } from '../../src/services/defaults.js';
import { quoteTotals } from '../../src/utils/quoteUtils.js';

const app = express();
const router = express.Router();
const loginRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.' } });
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

function clientDto(client) {
  const value = client.toObject ? client.toObject() : client;
  return { ...value, id: String(value._id), _id: undefined, __v: undefined };
}

function quoteDto(quote) {
  const value = quote.toObject ? quote.toObject() : quote;
  const items = value.items || [];
  return { ...value, id: String(value._id), _id: undefined, __v: undefined, clientId: String(value.clientId), ...quoteTotals(items) };
}

function settingsDto(settings) {
  if (!settings) return { ...DEFAULT_SETTINGS };
  const value = settings.toObject ? settings.toObject() : settings;
  return { ...DEFAULT_SETTINGS, ...value, id: undefined, __v: undefined };
}

function validId(id) { return /^[a-f\d]{24}$/i.test(id); }
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
function pick(source, fields) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
  return Object.fromEntries(fields.filter((key) => Object.hasOwn(source, key)).map((key) => [key, source[key]]));
}
function withoutMongoMeta(value) {
  const result = { ...value };
  delete result._id;
  delete result.__v;
  return result;
}
const clientFields = ['name', 'businessName', 'taxId', 'phone', 'whatsapp', 'email', 'address', 'city', 'notes'];
const quoteFields = ['number', 'clientId', 'date', 'validUntil', 'currency', 'status', 'items', 'notes', 'terms'];
const settingsFields = ['businessName', 'tradeName', 'taxId', 'phone', 'whatsapp', 'email', 'address', 'city', 'country', 'logo', 'prefix', 'nextNumber', 'defaultCurrency', 'defaultTax', 'defaultValidity', 'defaultNotes', 'defaultTerms'];
function errorMessage(error) {
  if (error?.name === 'ValidationError' || error?.name === 'StrictModeError' || error?.name === 'CastError') return error.message;
  return 'No se pudo completar la solicitud.';
}
async function resolvedSettings() {
  const settings = settingsDto(await Settings.findById('business').lean());
  const escapedPrefix = settings.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highest = await Quote.findOne({ number: { $regex: `^${escapedPrefix}-(\\d+)$` } }).sort({ number: -1 }).select({ number: 1 }).lean();
  settings.nextNumber = Math.max(Number(settings.nextNumber || 1), Number(highest?.number.match(/(\d+)$/)?.[1] || 0) + 1);
  return settings;
}

router.get('/health', (_req, res) => res.json({ ok: true, authConfigured: passwordHashConfigured() }));
router.post('/auth/login', loginRateLimit, asyncRoute(login));
router.post('/auth/logout', logout);
router.get('/auth/session', asyncRoute(async (req, res) => {
  if (!passwordHashConfigured()) return res.status(503).json({ error: 'El acceso todavía no está configurado en el servidor.' });
  return authStatus(req, res);
}));

router.use(requireAuth);
router.use(asyncRoute(async (_req, _res, next) => {
  await connectDatabase();
  next();
}));

router.get('/clients', asyncRoute(async (_req, res) => {
  const clients = await Client.find().sort({ name: 1 }).lean();
  return res.json(clients.map(clientDto));
}));
router.get('/clients/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Identificador de cliente inválido.' });
  const client = await Client.findById(req.params.id).lean();
  if (!client) return res.status(404).json({ error: 'No se encontró el cliente.' });
  return res.json(clientDto(client));
}));
router.post('/clients', asyncRoute(async (req, res) => {
  const client = await Client.create(pick(req.body, clientFields));
  return res.status(201).json(clientDto(client));
}));
router.put('/clients/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Identificador de cliente inválido.' });
  const client = await Client.findByIdAndUpdate(req.params.id, pick(req.body, clientFields), { new: true, runValidators: true, strict: 'throw' });
  if (!client) return res.status(404).json({ error: 'No se encontró el cliente.' });
  return res.json(clientDto(client));
}));
router.delete('/clients/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Identificador de cliente inválido.' });
  if (await Quote.exists({ clientId: req.params.id })) return res.status(409).json({ error: 'Este cliente tiene cotizaciones asociadas. Elimina o reasigna las cotizaciones antes de eliminarlo.' });
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) return res.status(404).json({ error: 'No se encontró el cliente.' });
  return res.status(204).end();
}));

router.get('/quotes', asyncRoute(async (_req, res) => {
  const quotes = await Quote.find().sort({ date: -1, createdAt: -1 }).lean();
  return res.json(quotes.map(quoteDto));
}));
router.get('/quotes/next-number', asyncRoute(async (_req, res) => {
  const settings = await resolvedSettings();
  return res.json({ number: `${settings.prefix}-${String(settings.nextNumber).padStart(6, '0')}` });
}));
router.get('/quotes/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Identificador de cotización inválido.' });
  const quote = await Quote.findById(req.params.id).lean();
  if (!quote) return res.status(404).json({ error: 'No se encontró la cotización.' });
  return res.json(quoteDto(quote));
}));
router.post('/quotes', asyncRoute(async (req, res) => {
  const payload = pick(req.body, quoteFields);
  if (!validId(String(payload.clientId || ''))) return res.status(400).json({ error: 'Selecciona un cliente válido.' });
  if (!await Client.exists({ _id: payload.clientId })) return res.status(400).json({ error: 'El cliente seleccionado ya no existe.' });
  const quote = await Quote.create(payload);
  return res.status(201).json(quoteDto(quote));
}));
router.put('/quotes/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Identificador de cotización inválido.' });
  const payload = pick(req.body, quoteFields);
  if (payload.clientId && !validId(String(payload.clientId))) return res.status(400).json({ error: 'Selecciona un cliente válido.' });
  if (payload.clientId && !await Client.exists({ _id: payload.clientId })) return res.status(400).json({ error: 'El cliente seleccionado ya no existe.' });
  const quote = await Quote.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true, strict: 'throw' });
  if (!quote) return res.status(404).json({ error: 'No se encontró la cotización.' });
  return res.json(quoteDto(quote));
}));
router.patch('/quotes/:id/status', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Identificador de cotización inválido.' });
  const quote = await Quote.findByIdAndUpdate(req.params.id, { status: req.body?.status }, { new: true, runValidators: true });
  if (!quote) return res.status(404).json({ error: 'No se encontró la cotización.' });
  return res.json(quoteDto(quote));
}));
router.delete('/quotes/:id', asyncRoute(async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Identificador de cotización inválido.' });
  const quote = await Quote.findByIdAndDelete(req.params.id);
  if (!quote) return res.status(404).json({ error: 'No se encontró la cotización.' });
  return res.status(204).end();
}));

router.get('/settings', asyncRoute(async (_req, res) => {
  return res.json(await resolvedSettings());
}));
router.put('/settings', asyncRoute(async (req, res) => {
  const current = await Settings.findById('business').lean();
  const settings = await Settings.findOneAndUpdate({ _id: 'business' }, { $set: { ...DEFAULT_SETTINGS, ...withoutMongoMeta(current || {}), ...pick(req.body, settingsFields) } }, { upsert: true, new: true, runValidators: true, strict: 'throw' });
  return res.json(settingsDto(settings));
}));

app.use('/api', router);
app.use((error, _req, res, _next) => {
  if (error?.code === 11000) return res.status(409).json({ error: 'Ya existe una cotización con ese número.' });
  if (error?.name === 'ValidationError' || error?.name === 'StrictModeError' || error?.name === 'CastError') return res.status(400).json({ error: errorMessage(error) });
  if (error?.name === 'MongoServerSelectionError' || error?.name === 'MongooseServerSelectionError') return res.status(503).json({ error: 'No se pudo conectar a la base de datos. Revisa Atlas y MONGODB_URI.' });
  console.error('API error:', error?.message || error);
  return res.status(500).json({ error: errorMessage(error) });
});

export default app;
