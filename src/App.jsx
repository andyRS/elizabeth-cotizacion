import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { authService } from './services/authService.js';
import './App.css';

const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const QuotesPage = lazy(() => import('./pages/QuotesPage.jsx'));
const QuoteForm = lazy(() => import('./pages/QuoteForm.jsx'));
const QuotePreview = lazy(() => import('./pages/QuotePreview.jsx'));
const ClientsPage = lazy(() => import('./pages/ClientsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));

export default function App() {
  const [authenticated, setAuthenticated] = useState(null);
  const [authError, setAuthError] = useState('');
  useEffect(() => {
    let active = true;
    authService.isAuthenticated().then((result) => { if (active) setAuthenticated(result); }).catch((error) => { if (active) { setAuthError(error.message); setAuthenticated(false); } });
    const onExpired = () => setAuthenticated(false);
    window.addEventListener('auth:expired', onExpired);
    return () => { active = false; window.removeEventListener('auth:expired', onExpired); };
  }, []);
  const logout = async () => { await authService.logout().catch(() => {}); setAuthenticated(false); };

  if (authenticated === null) return <div className="route-loading" role="status">Comprobando sesión…</div>;

  if (!authenticated) {
    return <Suspense fallback={<div className="route-loading" role="status">Cargando acceso…</div>}><LoginPage initialError={authError} onSuccess={() => { setAuthError(''); setAuthenticated(true); }} /></Suspense>;
  }

  return <Suspense fallback={<div className="route-loading" role="status">Cargando espacio de trabajo…</div>}><Routes><Route element={<Layout onLogout={logout} />}><Route index element={<Dashboard/>}/><Route path="cotizaciones" element={<QuotesPage/>}/><Route path="cotizaciones/nueva" element={<QuoteForm/>}/><Route path="cotizaciones/:id/editar" element={<QuoteForm/>}/><Route path="cotizaciones/:id" element={<QuotePreview/>}/><Route path="clientes" element={<ClientsPage/>}/><Route path="configuracion" element={<SettingsPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Route></Routes></Suspense>;
}
