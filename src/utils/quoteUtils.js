export const STATUS_LABELS = {
  draft: 'Borrador', pending: 'Pendiente', sent: 'Enviada', approved: 'Aprobada', rejected: 'Rechazada', expired: 'Vencida',
};

export const CURRENCY_INFO = {
  DOP: { locale: 'es-DO', name: 'Peso dominicano', rate: 1 },
  USD: { locale: 'en-US', name: 'Dólar estadounidense', rate: 60 },
};

export const MEASUREMENT_UNITS = [
  { value: 'yardas', label: 'Yardas' },
  { value: 'metros', label: 'Metros' },
  { value: 'pulgadas', label: 'Pulgadas' },
  { value: 'centimetros', label: 'Centímetros' },
  { value: 'unidades', label: 'Unidades' },
];

export function formatQuantity(quantity, unit = 'yardas') {
  const value = Number(quantity);
  if (!Number.isFinite(value)) return `${quantity} ${unit}`;

  const whole = Math.floor(value);
  const decimal = value - whole;
  const fractions = [
    [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 8], [3, 8], [5, 8], [7, 8],
  ];
  const fraction = fractions.find(([numerator, denominator]) => Math.abs(decimal - numerator / denominator) < 0.004);
  const amount = fraction
    ? `${whole ? `${whole} ` : ''}${fraction[0]}/${fraction[1]}`
    : new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(value);

  const singularUnits = { yardas: 'yarda', metros: 'metro', pulgadas: 'pulgada', centimetros: 'centímetro', unidades: 'unidad' };
  const displayUnit = value === 1 ? singularUnits[unit] || unit : unit;
  return `${amount} ${displayUnit}`;
}

export function formatMoney(amount, currency = 'DOP') {
  const value = Number(amount) || 0;
  const formatted = new Intl.NumberFormat(currency === 'DOP' ? 'es-DO' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${currency === 'DOP' ? 'RD$' : 'US$'} ${formatted}`;
}

export function quoteTotals(items = [], labor = 0) {
  const totals = items.reduce((result, item) => {
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.price) || 0);
    const base = quantity * price;
    const discount = base * Math.min(100, Math.max(0, Number(item.discount) || 0)) / 100;
    result.subtotal += base;
    result.discount += discount;
    result.total += base - discount;
    return result;
  }, { subtotal: 0, discount: 0, total: 0 });
  totals.labor = Math.max(0, Number(labor) || 0);
  totals.total += totals.labor;
  return totals;
}

export function dateOnly(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function addDays(date, days) {
  const result = new Date(`${date}T12:00:00`);
  result.setDate(result.getDate() + Number(days || 0));
  return dateOnly(result);
}

export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export function statusForDisplay(quote) {
  if (quote.status !== 'approved' && quote.status !== 'rejected' && quote.status !== 'draft' && quote.validUntil < dateOnly()) return 'expired';
  return quote.status;
}
