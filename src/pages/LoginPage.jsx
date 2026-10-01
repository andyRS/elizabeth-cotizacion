import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, FileText, LockKeyhole, ShieldCheck, Sprout } from 'lucide-react';
import { authService } from '../services/authService.js';
import '../styles/login.css';

export default function LoginPage({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    if (authService.login(username, password)) {
      onSuccess();
      return;
    }
    setSubmitting(false);
    setError('Usuario o contraseña incorrectos. Inténtalo de nuevo.');
  };

  return <main className="login-page">
    <section className="login-shell" aria-label="Acceso al sistema de cotizaciones">
      <aside className="login-showcase">
        <div className="login-showcase-brand"><span className="login-mark">EM</span><span>ELIZABETH MÉNDEZ<small>COTIZACIONES</small></span></div>
        <div className="login-showcase-copy"><span className="login-overline"><Sprout size={14}/> COSTURA Y CONFECCIÓN</span><h1>Cada puntada comienza con una buena cotización.</h1><p>Organiza prendas a medida, confecciones y arreglos desde un solo lugar.</p></div>
        <div className="login-showcase-note"><span><FileText size={16}/></span><div><strong>Todo en orden, en un solo lugar</strong><small>Clientes, cotizaciones y trabajos de costura.</small></div></div>
        <div className="login-showcase-orbit orbit-one"/><div className="login-showcase-orbit orbit-two"/>
      </aside>
      <div className="login-panel">
        <div className="login-panel-mobile-brand"><span className="login-mark">EM</span><span>ELIZABETH MÉNDEZ<small>COTIZACIONES</small></span></div>
        <div className="login-welcome"><span className="login-lock"><LockKeyhole size={19}/></span><div className="login-overline">BIENVENIDA DE NUEVO</div><h2>Iniciar sesión</h2><p>Ingresa tus credenciales para continuar.</p></div>
        <form className="login-form" onSubmit={submit}>
          <label className="login-field"><span>Usuario administrador</span><input autoFocus autoComplete="username" autoCapitalize="none" name="username" value={username} onChange={(event)=>setUsername(event.target.value)} placeholder="administrador" required/></label>
          <label className="login-field"><span>Contraseña</span><span className="login-password-wrap"><input autoComplete="current-password" name="password" type={visible?'text':'password'} value={password} onChange={(event)=>setPassword(event.target.value)} placeholder="Ingresa tu contraseña" required/><button type="button" onClick={()=>setVisible((current)=>!current)} aria-label={visible?'Ocultar contraseña':'Mostrar contraseña'}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>
          {error&&<div className="login-error" role="alert">{error}</div>}
          <button className="login-submit" type="submit" disabled={submitting}>{submitting?'Ingresando…':<>Entrar al sistema <ArrowRight size={17}/></>}</button>
        </form>
        <div className="login-security"><ShieldCheck size={16}/><span>Acceso privado para la administración</span></div>
        <div className="login-copyright">© {new Date().getFullYear()} Elizabeth Méndez · Gestión de cotizaciones</div>
      </div>
    </section>
  </main>;
}
