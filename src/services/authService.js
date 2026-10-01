export const authService = {
  async isAuthenticated() {
    const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
    if (!response.ok) return false;
    const payload = await response.json();
    return payload.authenticated === true;
  },
  async login(username, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || 'No se pudo iniciar sesión.');
      error.status = response.status;
      throw error;
    }
    return payload.authenticated === true;
  },
  async logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  },
};
