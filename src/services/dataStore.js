import { DEFAULT_SETTINGS } from './defaults.js';

async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('auth:expired'));
    const error = new Error(payload.error || `La solicitud falló (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function json(body) { return JSON.stringify(body); }

export const dataStore = {
  clients: {
    list: () => request('/clients'),
    get: (id) => request(`/clients/${encodeURIComponent(id)}`),
    save: (client) => client.id
      ? request(`/clients/${encodeURIComponent(client.id)}`, { method: 'PUT', body: json(client) })
      : request('/clients', { method: 'POST', body: json(client) }),
    remove: (id) => request(`/clients/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },
  quotes: {
    list: () => request('/quotes'),
    get: (id) => request(`/quotes/${encodeURIComponent(id)}`),
    save: (quote) => quote.id
      ? request(`/quotes/${encodeURIComponent(quote.id)}`, { method: 'PUT', body: json(quote) })
      : request('/quotes', { method: 'POST', body: json(quote) }),
    changeStatus: (id, status) => request(`/quotes/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: json({ status }) }),
    remove: (id) => request(`/quotes/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    nextNumber: async () => (await request('/quotes/next-number')).number,
  },
  settings: {
    get: async () => ({ ...DEFAULT_SETTINGS, ...await request('/settings') }),
    save: (settings) => request('/settings', { method: 'PUT', body: json(settings) }),
  },
};
