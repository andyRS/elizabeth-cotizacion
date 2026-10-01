import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Field } from './ui.jsx';
import { dataStore } from '../services/dataStore.js';

const blank = { name: '', businessName: '', taxId: '', phone: '', whatsapp: '', email: '', address: '', city: '', notes: '' };
export default function ClientModal({ onClose, onSaved }) {
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return setError('Ingresa el nombre del cliente.');
    try { const client = await dataStore.clients.save(form); onSaved(client); onClose(); } catch (exception) { setError(exception.message); }
  };
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal-card" onSubmit={save} aria-labelledby="client-modal-title"><div className="modal-heading"><div><div className="eyebrow">Directorio</div><h2 id="client-modal-title">Nuevo cliente</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={19}/></button></div><div className="form-grid"><Field label="Nombre / razón social *"><input required autoFocus value={form.name} onChange={(e)=>update('name',e.target.value)} placeholder="Nombre completo"/></Field><Field label="Nombre comercial"><input value={form.businessName} onChange={(e)=>update('businessName',e.target.value)} placeholder="Empresa"/></Field><Field label="RNC / Cédula"><input value={form.taxId} onChange={(e)=>update('taxId',e.target.value)}/></Field><Field label="Teléfono"><input value={form.phone} onChange={(e)=>update('phone',e.target.value)}/></Field><Field label="WhatsApp"><input value={form.whatsapp} onChange={(e)=>update('whatsapp',e.target.value)}/></Field><Field label="Correo electrónico"><input type="email" value={form.email} onChange={(e)=>update('email',e.target.value)}/></Field><Field label="Dirección"><input value={form.address} onChange={(e)=>update('address',e.target.value)}/></Field><Field label="Ciudad"><input value={form.city} onChange={(e)=>update('city',e.target.value)}/></Field><Field label="Notas" className="field-wide"><textarea rows="2" value={form.notes} onChange={(e)=>update('notes',e.target.value)}/></Field></div>{error&&<p className="inline-error">{error}</p>}<div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit">Guardar cliente</Button></div></form></div>;
}
