import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuotePdf, quotePdfFileName } from '../../src/services/pdfService.js';
import { formatQuantity, quoteTotals } from '../../src/utils/quoteUtils.js';
import { Quote } from '../_lib/models.js';
import { deflateSync } from 'node:zlib';

const settings = { businessName: 'Elizabeth Méndez', tradeName: 'Costura y confección', phone: '', email: '', taxId: '', logo: '' };
function pngChunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const payload = Buffer.concat([name, data]);
  let crc = 0xffffffff;
  for (const byte of payload) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
  }
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, payload, checksum]);
}
function makePixelPng() {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([
    Buffer.from('89504e470d0a1a0a', 'hex'),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(Buffer.from([0, 52, 128, 44, 255]))),
    pngChunk('IEND', Buffer.alloc(0)),
  ]).toString('base64');
}
const quote = {
  id: 'test-quote', number: 'COT-000042', date: '2026-09-30', validUntil: '2026-10-15', currency: 'DOP', status: 'draft',
  items: [
    { id: 'line-1', description: 'Vestido de fiesta a medida', quantity: 1, price: 8500, discount: 0, tax: 0 },
    { id: 'line-2', description: 'Tela satinada y forro', quantity: 3, price: 450, discount: 0, tax: 0 },
  ],
  labor: 3200,
  garmentImage: '',
  detailImages: [],
  notes: '',
  terms: '',
};

test('EATELIERM PDF uses its branded quotation filename and produces one A4 page without photos', async () => {
  const pdf = await createQuotePdf(quote, { name: 'Ingrid Peralta' }, settings);
  assert.equal(quotePdfFileName(quote, { name: 'Ingrid Peralta' }), 'Cotizacion-EATELIERM-COT-000042-Ingrid-Peralta.pdf');
  assert.equal(pdf.getNumberOfPages(), 1);
  assert.ok(pdf.output('arraybuffer').byteLength > 3000);
  assert.doesNotMatch(pdf.output(), /Impuestos/);
  assert.match(pdf.output(), /EatelierM/);
  assert.doesNotMatch(pdf.output(), /Gracias por confiar/);
});

test('EATELIERM PDF embeds optional garment and fabric reference images', async () => {
  const tinyPng = `data:image/png;base64,${makePixelPng()}`;
  const pdf = await createQuotePdf({ ...quote, garmentImage: tinyPng, detailImages: [tinyPng] }, { name: 'Ingrid Peralta' }, settings);
  assert.equal(pdf.getNumberOfPages(), 1);
  assert.match(pdf.output(), /\/Subtype\s*\/Image/);
});

test('quote totals include sewing labor without changing material subtotal', () => {
  const totals = quoteTotals(quote.items, quote.labor);
  assert.equal(totals.subtotal, 9850);
  assert.equal(totals.labor, 3200);
  assert.equal(totals.total, 13050);
});

test('legacy item taxes are ignored in quotation totals', () => {
  const totals = quoteTotals([{ quantity: 2, price: 100, tax: 18 }], 25);
  assert.deepEqual(totals, { subtotal: 200, discount: 0, total: 225, labor: 25 });
});

test('fabric quantities format common fractions and measurement units', () => {
  assert.equal(formatQuantity(1), '1 yarda');
  assert.equal(formatQuantity(1.5), '1 1/2 yardas');
  assert.equal(formatQuantity(0.75, 'metros'), '3/4 metros');
  assert.equal(formatQuantity(1.37, 'pulgadas'), '1.37 pulgadas');
});

test('quote schema accepts optional reference and material photos without requiring them', () => {
  const document = new Quote({ ...quote, clientId: '507f1f77bcf86cd799439011' });
  assert.equal(document.validateSync(), undefined);
  assert.equal(document.items[1].unit, 'yardas');
});

test('quote schema requires a positive labor amount', () => {
  const document = new Quote({ ...quote, labor: 0, clientId: '507f1f77bcf86cd799439011' });
  assert.ok(document.validateSync()?.errors.labor);
});

test('quote schema limits material detail images to two', () => {
  const document = new Quote({ ...quote, clientId: '507f1f77bcf86cd799439011', detailImages: ['a', 'b', 'c'] });
  assert.ok(document.validateSync()?.errors.detailImages);
});
