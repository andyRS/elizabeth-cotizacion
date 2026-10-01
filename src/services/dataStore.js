import { addDays, dateOnly, quoteTotals } from '../utils/quoteUtils.js';

const KEYS = { clients: 'em_quotes_clients_v1', quotes: 'em_quotes_quotes_v1', settings: 'em_quotes_settings_v1' };

const demoClients = [
  { id: 'cl-1', name: 'María Rodríguez', businessName: 'Atelier Mar', taxId: '001-1849203-2', phone: '809-555-0182', whatsapp: '809-555-0182', email: 'maria@ateliermar.do', address: 'Av. Winston Churchill 45', city: 'Santo Domingo', notes: '' },
  { id: 'cl-2', name: 'Carlos Jiménez', businessName: 'Novias Jiménez', taxId: '1-31-48291-7', phone: '809-555-0134', whatsapp: '809-555-0134', email: 'carlos@noviasjimenez.do', address: 'Calle El Sol 18', city: 'Santiago', notes: '' },
  { id: 'cl-3', name: 'Ana Pérez', businessName: 'Boutique ABC', taxId: '1-32-50841-1', phone: '829-555-0171', whatsapp: '829-555-0171', email: 'ana@boutiqueabc.do', address: 'Av. Abraham Lincoln 102', city: 'Santo Domingo', notes: '' },
  { id: 'cl-4', name: 'José Santos', businessName: 'Uniformes Horizonte', taxId: '1-30-39201-8', phone: '809-555-0160', whatsapp: '809-555-0160', email: 'jose@uniformeshorizonte.do', address: 'Calle Duarte 12', city: 'La Romana', notes: '' },
];

const today = dateOnly();
const demoQuotes = [
  { id: 'q-1', number: 'COT-000015', clientId: 'cl-2', date: addDays(today, -1), validUntil: addDays(today, 14), currency: 'DOP', status: 'approved', items: [{ id: 'i-1', description: 'Vestido de novia a medida con prueba y ajustes', quantity: 1, price: 24500, discount: 0, tax: 18 }], notes: 'Incluye toma de medidas, prueba y ajustes finales.', terms: 'La tela se selecciona y aprueba antes de iniciar la confección.' },
  { id: 'q-2', number: 'COT-000014', clientId: 'cl-1', date: addDays(today, -3), validUntil: addDays(today, 12), currency: 'DOP', status: 'pending', items: [{ id: 'i-2', description: 'Confección de vestido de gala a medida', quantity: 1, price: 10847.46, discount: 0, tax: 18 }], notes: 'Incluye dos pruebas de ajuste.', terms: 'Validez de 15 días. El precio de la tela se confirma por separado.' },
  { id: 'q-3', number: 'COT-000013', clientId: 'cl-3', date: addDays(today, -6), validUntil: addDays(today, 9), currency: 'USD', status: 'draft', items: [{ id: 'i-3', description: 'Ajustes y composturas de prendas', quantity: 5, price: 170, discount: 0, tax: 0 }], notes: 'Servicio de compostura para prendas seleccionadas.', terms: 'No incluye materiales especiales ni cierres.' },
  { id: 'q-4', number: 'COT-000012', clientId: 'cl-4', date: addDays(today, -18), validUntil: addDays(today, -3), currency: 'DOP', status: 'sent', items: [{ id: 'i-4', description: 'Confección de uniformes escolares', quantity: 2, price: 9800, discount: 5, tax: 18 }], notes: 'Precios sujetos a confirmación de tallas y telas.', terms: 'Validez de 15 días.' },
];

const defaultSettings = {
  businessName: 'Elizabeth Méndez', tradeName: 'Costura y confección', taxId: '', phone: '', whatsapp: '', email: '', address: '', city: 'Santo Domingo', country: 'República Dominicana', logo: '', prefix: 'COT', nextNumber: 16, defaultCurrency: 'DOP', defaultTax: 18, defaultValidity: 15, defaultNotes: 'Gracias por confiar en mi trabajo de costura. Estoy a tu disposición para cualquier ajuste.', defaultTerms: 'La cotización tiene una validez de 15 días. El inicio del trabajo se coordina al aprobar el diseño, las medidas y los materiales.',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    write(key, fallback);
    return fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value; }
function createId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export const dataStore = {
  clients: {
    list() {
      const records = read(KEYS.clients, demoClients);
      const demoNames = { 'Estudio Mar': 'Atelier Mar', 'Constructora JF': 'Novias Jiménez', 'Empresa ABC': 'Boutique ABC', 'Grupo Horizonte': 'Uniformes Horizonte' };
      let changed = false;
      const migrated = records.map((client) => {
        const businessName = demoNames[client.businessName];
        if (!businessName) return client;
        changed = true;
        const email = client.email?.replace('estudiomar', 'ateliermar').replace('constructorajf', 'noviasjimenez').replace('empresaabc', 'boutiqueabc').replace('horizonte', 'uniformeshorizonte');
        return { ...client, businessName, email };
      });
      if (changed) write(KEYS.clients, migrated);
      return migrated;
    },
    get: (id) => dataStore.clients.list().find((client) => client.id === id),
    save(client) {
      const records = dataStore.clients.list();
      const value = { ...client, id: client.id || createId() };
      const index = records.findIndex((entry) => entry.id === value.id);
      if (index < 0) records.unshift(value); else records[index] = value;
      write(KEYS.clients, records);
      return value;
    },
    remove(id) {
      if (dataStore.quotes.list().some((quote) => quote.clientId === id)) throw new Error('Este cliente tiene cotizaciones asociadas. Elimina o reasigna las cotizaciones antes de eliminarlo.');
      write(KEYS.clients, dataStore.clients.list().filter((client) => client.id !== id));
    },
  },
  quotes: {
    list() {
      const descriptions = {
        'Remodelación de área comercial': 'Vestido de novia a medida con prueba y ajustes',
        'Diseño de identidad visual': 'Confección de vestido de gala a medida',
        'Consultoría y estrategia digital': 'Ajustes y composturas de prendas',
        'Acompañamiento de proyecto': 'Confección de uniformes escolares',
      };
      const demoNotes = {
        'Gracias por la oportunidad de presentar nuestra propuesta.': 'Incluye toma de medidas, prueba y ajustes finales.',
        'Incluye dos rondas de ajustes.': 'Incluye dos pruebas de ajuste.',
        'Gracias por la oportunidad de presentar nuestra propuesta. ': 'Gracias por confiar en mi trabajo de costura. Estoy a tu disposición para cualquier ajuste.',
      };
      const demoTerms = {
        'Esta cotización tiene una validez de 15 días.': 'La tela se selecciona y aprueba antes de iniciar la confección.',
        'Validez de 15 días.': 'Validez de 15 días. El precio de telas y materiales especiales se confirma por separado.',
      };
      let changed = false;
      const records = read(KEYS.quotes, demoQuotes).map((quote) => {
        const items = quote.items.map((item) => {
          const description = descriptions[item.description];
          if (!description) return item;
          changed = true;
          return { ...item, description };
        });
        const notes = demoNotes[quote.notes] || quote.notes;
        const terms = demoTerms[quote.terms] || quote.terms;
        if (notes !== quote.notes || terms !== quote.terms) changed = true;
        return { ...quote, items, notes, terms, ...quoteTotals(items) };
      });
      if (changed) write(KEYS.quotes, records);
      return records;
    },
    get: (id) => dataStore.quotes.list().find((quote) => quote.id === id),
    save(quote) {
      const records = dataStore.quotes.list();
      const value = { ...quote, id: quote.id || createId(), ...quoteTotals(quote.items) };
      const index = records.findIndex((entry) => entry.id === value.id);
      if (index < 0) records.unshift(value); else records[index] = value;
      write(KEYS.quotes, records);
      if (index < 0) {
        const settings = dataStore.settings.get();
        const sequence = Number(value.number.match(/(\d+)$/)?.[1]);
        if (Number.isFinite(sequence) && sequence >= Number(settings.nextNumber || 1)) {
          dataStore.settings.save({ ...settings, nextNumber: sequence + 1 });
        }
      }
      return value;
    },
    remove(id) { write(KEYS.quotes, dataStore.quotes.list().filter((quote) => quote.id !== id)); },
    nextNumber() {
      const settings = dataStore.settings.get();
      return `${settings.prefix || 'COT'}-${String(settings.nextNumber || 1).padStart(6, '0')}`;
    },
  },
  settings: {
    get() {
      const settings = read(KEYS.settings, defaultSettings);
      if (settings.tradeName === 'Gestión Comercial') {
        const migrated = { ...settings, tradeName: defaultSettings.tradeName, defaultNotes: defaultSettings.defaultNotes, defaultTerms: defaultSettings.defaultTerms };
        write(KEYS.settings, migrated);
        return migrated;
      }
      return settings;
    },
    save(settings) { return write(KEYS.settings, settings); },
    resetDemo() {
      write(KEYS.clients, demoClients);
      write(KEYS.quotes, demoQuotes);
      write(KEYS.settings, defaultSettings);
    },
  },
};
