import { AlertCircle, Check, ChevronDown, FilePlus2, LoaderCircle, Search, X } from 'lucide-react';
import { STATUS_LABELS } from '../utils/quoteUtils.js';

export function Button({ children, variant = 'primary', size, className = '', ...props }) {
  return <button className={`btn btn-${variant}${size ? ` btn-${size}` : ''} ${className}`} {...props}>{children}</button>;
}
export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>;
}
export function Card({ children, className = '', ...props }) { return <section className={`card ${className}`} {...props}>{children}</section>; }
export function Field({ label, hint, error, children, className = '' }) { return <label className={`field ${className}`}><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}{error && <span className="field-error"><AlertCircle size={14}/>{error}</span>}</label>; }
export function StatusBadge({ status }) { return <span className={`status-badge status-${status}`}>{STATUS_LABELS[status] || status}</span>; }
export function EmptyState({ icon: Icon = FilePlus2, title, description, action }) { return <div className="empty-state"><span className="empty-icon"><Icon size={23}/></span><h3>{title}</h3><p>{description}</p>{action}</div>; }
export function SearchInput({ value, onChange, placeholder = 'Buscar...' }) { return <div className="search-input"><Search size={17}/><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder}/>{value && <button onClick={() => onChange('')} aria-label="Limpiar búsqueda"><X size={15}/></button>}</div>; }
export function Select({ children, className = '', ...props }) { return <div className={`select-wrap ${className}`}><select {...props}>{children}</select><ChevronDown size={15}/></div>; }
export function Spinner({ label = 'Cargando' }) { return <div className="spinner" role="status"><LoaderCircle className="spin" size={20}/><span>{label}</span></div>; }
export function Toast({ toast, onClose }) { if (!toast) return null; return <div className={`toast toast-${toast.type || 'success'}`} role="status"><Check size={18}/><span>{toast.message}</span><button onClick={onClose} aria-label="Cerrar aviso"><X size={16}/></button></div>; }
export function ConfirmDialog({ title, message, onCancel, onConfirm, confirmLabel = 'Eliminar' }) { return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title"><span className="dialog-icon"><AlertCircle size={22}/></span><h2 id="dialog-title">{title}</h2><p>{message}</p><div className="dialog-actions"><Button variant="ghost" onClick={onCancel}>Cancelar</Button><Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button></div></section></div>; }
