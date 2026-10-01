import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, LogOut, Menu, Settings, Users, X, Lightbulb, ChevronRight } from 'lucide-react';
import { Toast } from './ui.jsx';
import { dataStore } from '../services/dataStore.js';

const navigation = [
  { to: '/', label: 'Panel', icon: LayoutDashboard, end: true },
  { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Layout({ onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const location = useLocation();
  const settings = dataStore.settings.get();
  const heading = navigation.find((item) => item.to === location.pathname)?.label || 'Cotización';
  const notify = (message, type = 'success') => { setToast({ message, type }); window.setTimeout(() => setToast(null), 3400); };
  const outletContext = { notify };
  return <div className="app-shell">
    {mobileOpen && <button className="mobile-backdrop" aria-label="Cerrar navegación" onClick={() => setMobileOpen(false)}/>}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-lockup"><div className="brand-mark">EM</div><div className="brand-copy"><strong>ELIZABETH MÉNDEZ</strong><span>COTIZACIONES</span></div><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú"><X size={19}/></button></div>
      <div className="nav-caption">TALLER DE COSTURA</div>
      <nav className="side-nav" aria-label="Navegación principal">{navigation.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} onClick={()=>setMobileOpen(false)} className={({isActive})=>`nav-link ${isActive?'nav-link-active':''}`}><Icon size={18} strokeWidth={1.8}/><span>{label}</span>{label==='Cotizaciones'&&<ChevronRight className="nav-chevron" size={15}/>}</NavLink>)}</nav>
      <div className="sidebar-spacer"/>
      <div className="sidebar-tip"><span><Lightbulb size={15}/> TIP</span><p>Cotiza confecciones, arreglos y prendas a medida. Guarda tus clientes para preparar más rápido cada presupuesto.</p></div>
      <div className="sidebar-profile"><div className="profile-avatar">{(settings.businessName||'Elizabeth Méndez').split(' ').map(x=>x[0]).slice(0,2).join('')}</div><div><strong>{settings.businessName||'Elizabeth Méndez'}</strong><span>Administradora</span></div><button className="profile-more" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={16}/></button></div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={()=>setMobileOpen(true)} aria-label="Abrir menú"><Menu size={21}/></button><div className="breadcrumb">Elizabeth Méndez <ChevronRight size={14}/><strong>{heading}</strong></div><div className="topbar-status"><span className="status-dot"/> Espacio de trabajo</div></header><div className="page-content page-enter"><Outlet context={outletContext}/></div></main>
    <Toast toast={toast} onClose={()=>setToast(null)}/>
  </div>;
}
