import mongoose from 'mongoose';

const { Schema } = mongoose;

const clientSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  businessName: { type: String, trim: true, maxlength: 180, default: '' },
  taxId: { type: String, trim: true, maxlength: 80, default: '' },
  phone: { type: String, trim: true, maxlength: 80, default: '' },
  whatsapp: { type: String, trim: true, maxlength: 80, default: '' },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  address: { type: String, trim: true, maxlength: 400, default: '' },
  city: { type: String, trim: true, maxlength: 120, default: '' },
  notes: { type: String, trim: true, maxlength: 3000, default: '' },
}, { timestamps: true, strict: 'throw' });

const itemSchema = new Schema({
  id: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, enum: ['yardas', 'metros', 'pulgadas', 'centimetros', 'unidades'], default: 'yardas' },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, min: 0, max: 100, default: 0 },
  tax: { type: Number, min: 0, max: 100, default: 0 },
}, { _id: false, strict: 'throw' });

const quoteSchema = new Schema({
  number: { type: String, required: true, trim: true, maxlength: 40, unique: true, index: true },
  clientId: { type: Schema.Types.ObjectId, ref: 'QuoteClient', required: true, index: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  validUntil: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  currency: { type: String, enum: ['DOP', 'USD'], required: true },
  status: { type: String, enum: ['draft', 'pending', 'sent', 'approved', 'rejected'], default: 'draft' },
  items: { type: [itemSchema], required: true, validate: (items) => items.length > 0 && items.length <= 100 },
  labor: { type: Number, required: true, min: 0.01 },
  garmentImage: { type: String, maxlength: 750000, default: '' },
  detailImages: { type: [String], default: [], validate: (images) => images.length <= 2 && images.every((image) => image.length <= 400000) },
  notes: { type: String, maxlength: 5000, default: '' },
  terms: { type: String, maxlength: 5000, default: '' },
}, { timestamps: true, strict: 'throw' });

const settingsSchema = new Schema({
  _id: { type: String, default: 'business' },
  businessName: { type: String, required: true, trim: true, maxlength: 180 },
  tradeName: { type: String, trim: true, maxlength: 180, default: '' },
  taxId: { type: String, trim: true, maxlength: 80, default: '' },
  phone: { type: String, trim: true, maxlength: 80, default: '' },
  whatsapp: { type: String, trim: true, maxlength: 80, default: '' },
  email: { type: String, trim: true, maxlength: 254, default: '' },
  address: { type: String, trim: true, maxlength: 400, default: '' },
  city: { type: String, trim: true, maxlength: 120, default: '' },
  country: { type: String, trim: true, maxlength: 120, default: '' },
  logo: { type: String, maxlength: 1500000, default: '' },
  prefix: { type: String, trim: true, uppercase: true, maxlength: 8, default: 'COT' },
  nextNumber: { type: Number, min: 1, default: 1 },
  defaultCurrency: { type: String, enum: ['DOP', 'USD'], default: 'DOP' },
  defaultTax: { type: Number, min: 0, max: 100, default: 18 },
  defaultValidity: { type: Number, min: 1, max: 365, default: 15 },
  defaultNotes: { type: String, maxlength: 5000, default: '' },
  defaultTerms: { type: String, maxlength: 5000, default: '' },
}, { timestamps: true, strict: 'throw', collection: 'settings' });

export const Client = mongoose.models.QuoteClient || mongoose.model('QuoteClient', clientSchema, 'clients');
export const Quote = mongoose.models.SewingQuote || mongoose.model('SewingQuote', quoteSchema, 'quotes');
export const Settings = mongoose.models.BusinessSettings || mongoose.model('BusinessSettings', settingsSchema, 'settings');
