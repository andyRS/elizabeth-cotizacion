import { lazy, Suspense, useState } from 'react';
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
  const [authenticated, setAuthenticated] = useState(() => authService.isAuthenticated());
  const logout = () => { authService.logout(); setAuthenticated(false); };

  if (!authenticated) {
    return <Suspense fallback={<div className="route-loading" role="status">Cargando acceso…</div>}><LoginPage onSuccess={() => setAuthenticated(true)} /></Suspense>;
  }

  return <Suspense fallback={<div className="route-loading" role="status">Cargando espacio de trabajo…</div>}><Routes><Route element={<Layout onLogout={logout} />}><Route index element={<Dashboard/>}/><Route path="cotizaciones" element={<QuotesPage/>}/><Route path="cotizaciones/nueva" element={<QuoteForm/>}/><Route path="cotizaciones/:id/editar" element={<QuoteForm/>}/><Route path="cotizaciones/:id" element={<QuotePreview/>}/><Route path="clientes" element={<ClientsPage/>}/><Route path="configuracion" element={<SettingsPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Route></Routes></Suspense>;
}
