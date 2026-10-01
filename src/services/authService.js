const SESSION_KEY = 'em_quotes_authenticated_v1';
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'administrador';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

export const authService = {
  isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  },
  login(username, password) {
    const valid = Boolean(ADMIN_PASSWORD) && username.trim().toLocaleLowerCase() === ADMIN_USERNAME.toLocaleLowerCase() && password === ADMIN_PASSWORD;
    if (valid) sessionStorage.setItem(SESSION_KEY, 'true');
    return valid;
  },
  logout() {
    sessionStorage.removeItem(SESSION_KEY);
  },
};
