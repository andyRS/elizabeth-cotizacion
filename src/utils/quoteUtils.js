export const STATUS_LABELS = {
  draft: 'Borrador', pending: 'Pendiente', sent: 'Enviada', approved: 'Aprobada', rejected: 'Rechazada', expired: 'Vencida',
};

export const CURRENCY_INFO = {
  DOP: { locale: 'es-DO', name: 'Peso dominicano', rate: 1 },
  USD: { locale: 'en-US', name: 'Dólar estadounidense', rate: 60 },
};

export function formatMoney(amount, currency = 'DOP') {
  const value = Number(amount) || 0;
  const formatted = new Intl.NumberFormat(currency === 'DOP' ? 'es-DO' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${currency === 'DOP' ? 'RD$' : 'US$'} ${formatted}`;
}

export function quoteTotals(items = []) {
  return items.reduce((totals, item) => {
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.price) || 0);
    const base = quantity * price;
    const discount = base * Math.min(100, Math.max(0, Number(item.discount) || 0)) / 100;
    const tax = (base - discount) * Math.max(0, Number(item.tax) || 0) / 100;
    totals.subtotal += base;
    totals.discount += discount;
    totals.tax += tax;
    totals.total += base - discount + tax;
    return totals;
  }, { subtotal: 0, discount: 0, tax: 0, total: 0 });
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
