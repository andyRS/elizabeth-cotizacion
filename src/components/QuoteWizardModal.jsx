import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CirclePlus, FileText, Ruler, Trash2, UserRound, WalletCards, X } from 'lucide-react';
import { Button, Field, Select } from './ui.jsx';
import PhotoAttachments from './PhotoAttachments.jsx';
import { addDays, formatMoney, formatQuantity, MEASUREMENT_UNITS } from '../utils/quoteUtils.js';
import '../styles/quote-wizard-modal.css';

const steps = [
  { title: 'Cliente y fecha', icon: UserRound },
  { title: 'Telas y medidas', icon: Ruler },
  { title: 'Revisar y guardar', icon: WalletCards },
];

function lineTotal(item) {
  const base = Number(item.quantity || 0) * Number(item.price || 0);
  return base * (1 - Number(item.discount || 0) / 100);
}

export default function QuoteWizardModal({
  form,
  clients,
  selectedClient,
  totals,
  error,
  isEditing,
  onClose,
  onSaveClient,
  onUpdate,
  onUpdateItem,
  onAddLine,
  onRemoveLine,
  onPhotosChange,
  onSaveThenPreview,
}) {
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState('');
  const [saving, setSaving] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const [clientSaving, setClientSaving] = useState(false);
  const [clientError, setClientError] = useState('');
  const [clientDraft, setClientDraft] = useState({ name: '', businessName: '', phone: '', email: '', taxId: '' });
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    const wasInert = appRoot?.hasAttribute('inert') || false;
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('inert', '');
    dialogRef.current?.focus();
    const handleKeyDown = (event) => {
      if (document.querySelector('.client-dialog-backdrop')) return;
      if (event.key === 'Escape') {
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (appRoot && !wasInert) appRoot.removeAttribute('inert');
      previousFocus?.focus?.();
    };
  }, []);

  const daysValid = Math.round((new Date(`${form.validUntil}T12:00:00`) - new Date(`${form.date}T12:00:00`)) / 86400000);
  const validityChoice = ['7', '15', '30'].includes(String(daysValid)) ? String(daysValid) : 'custom';
  const selectedUnit = (value) => MEASUREMENT_UNITS.find((unit) => unit.value === value) || MEASUREMENT_UNITS[0];

  const advance = () => {
    setStepError('');
    if (step === 0) {
      if (!form.clientId) {
        setStepError('Elige un cliente o agrega uno nuevo para continuar.');
        return;
      }
      if (!form.date || !form.validUntil || form.validUntil < form.date) {
        setStepError('Revisa las fechas de emisión y vencimiento para continuar.');
        return;
      }
    }
    if (step === 1 && (!form.items.length || form.items.some((item) => !item.description.trim() || Number(item.quantity) <= 0 || String(item.price).trim() === '' || !Number.isFinite(Number(item.price)) || Number(item.price) < 0 || Number(item.discount) < 0 || Number(item.discount) > 100))) {
      setStepError('Agrega al menos una tela y revisa el nombre, la cantidad y el precio de cada una.');
      return;
    }
    setStep(Math.min(step + 1, steps.length - 1));
  };

  const save = async (status) => {
    if (!Number.isFinite(Number(form.labor)) || Number(form.labor) <= 0) {
      setStepError('La mano de obra es obligatoria. Indica un importe mayor que cero.');
      return;
    }
    setSaving(true);
    setStepError('');
    try {
      await onSaveThenPreview(status);
    } finally {
      setSaving(false);
    }
  };

  const saveClient = async (event) => {
    event.preventDefault();
    setClientError('');
    if (!clientDraft.name.trim()) {
      setClientError('Escribe el nombre del cliente para guardarlo.');
      return;
    }
    setClientSaving(true);
    try {
      await onSaveClient({ ...clientDraft, name: clientDraft.name.trim() });
      setClientDraft({ name: '', businessName: '', phone: '', email: '', taxId: '' });
      setAddingClient(false);
    } catch (exception) {
      setClientError(exception.message || 'No se pudo guardar el cliente.');
    } finally {
      setClientSaving(false);
    }
  };

  const content = <div className="quote-wizard-backdrop">
    <section className="quote-wizard-modal" role="dialog" aria-modal="true" aria-labelledby="quote-wizard-title" ref={dialogRef} tabIndex={-1}>
      <header className="quote-wizard-header">
        <div className="quote-wizard-title-group">
          <span className="quote-wizard-brand-icon"><FileText size={19}/></span>
          <div><span className="eyebrow">COTIZACIÓN {form.number}</span><h1 id="quote-wizard-title">{isEditing ? 'Editar cotización' : 'Nueva cotización'}</h1></div>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Salir de la cotización"><X size={19}/></button>
      </header>

      <nav className="quote-wizard-steps" aria-label="Pasos de la cotización">
        {steps.map(({ title, icon: Icon }, index) => <button key={title} type="button" className={`quote-wizard-step${step === index ? ' is-current' : ''}${step > index ? ' is-complete' : ''}`} onClick={() => { if (index < step) { setStep(index); setStepError(''); } }} disabled={index > step} aria-current={step === index ? 'step' : undefined}>
          <span className="quote-wizard-step-mark">{step > index ? <Check size={15}/> : <Icon size={15}/>}</span><span><small>PASO {index + 1}</small><strong>{title}</strong></span>
        </button>)}
      </nav>

      <main className="quote-wizard-content" key={step}>
        {step === 0 && <section className="quote-wizard-panel" aria-labelledby="quote-step-one-title">
          <div className="quote-wizard-panel-heading"><span>EMPECEMOS</span><h2 id="quote-step-one-title">¿A quién le vas a cotizar?</h2><p>Elige el cliente y confirma la fecha de esta propuesta.</p></div>
          {addingClient ? <form className="quote-wizard-new-client" onSubmit={saveClient}>
            <div className="quote-wizard-new-client-heading"><strong>Nuevo cliente</strong><button type="button" className="text-link" onClick={() => { setAddingClient(false); setClientError(''); }}>Elegir un cliente guardado</button></div>
            <div className="quote-wizard-new-client-fields">
              <Field label="Nombre del cliente *"><input autoFocus value={clientDraft.name} onChange={(event) => setClientDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre y apellido" required/></Field>
              <Field label="Empresa (opcional)"><input value={clientDraft.businessName} onChange={(event) => setClientDraft((current) => ({ ...current, businessName: event.target.value }))} placeholder="Nombre comercial"/></Field>
              <Field label="Teléfono (opcional)"><input type="tel" inputMode="tel" value={clientDraft.phone} onChange={(event) => setClientDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="809 555 0000"/></Field>
              <Field label="Correo (opcional)"><input type="email" inputMode="email" value={clientDraft.email} onChange={(event) => setClientDraft((current) => ({ ...current, email: event.target.value }))} placeholder="cliente@correo.com"/></Field>
            </div>
            {clientError && <p className="quote-wizard-error" role="alert">{clientError}</p>}
            <Button type="submit" disabled={clientSaving}>{clientSaving ? 'Guardando cliente…' : 'Guardar y seleccionar cliente'} <Check size={15}/></Button>
          </form> : <div className="quote-wizard-client-row">
            <Field label="Cliente">
              <Select value={form.clientId} onChange={(event) => onUpdate('clientId', event.target.value)} aria-label="Seleccionar cliente">
                <option value="">Selecciona un cliente</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.businessName ? `${client.businessName} · ${client.name}` : client.name}</option>)}
              </Select>
            </Field>
            <Button type="button" variant="outline" onClick={() => setAddingClient(true)}><CirclePlus size={16}/> Agregar cliente</Button>
          </div>}
          {selectedClient && <div className="quote-wizard-selected-client"><span>{(selectedClient.businessName || selectedClient.name).slice(0, 1).toUpperCase()}</span><div><strong>{selectedClient.businessName || selectedClient.name}</strong><small>{selectedClient.phone || selectedClient.email || 'Cliente seleccionado'}</small></div><Check size={17}/></div>}
          <div className="quote-wizard-fields quote-wizard-date-fields">
            <Field label="Fecha de emisión"><input type="date" value={form.date} onChange={(event) => { const nextDate = event.target.value; onUpdate('date', nextDate); if (validityChoice !== 'custom') onUpdate('validUntil', addDays(nextDate, Number(validityChoice))); }} required/></Field>
            <Field label="Válida por"><Select value={validityChoice} onChange={(event) => { if (event.target.value !== 'custom') onUpdate('validUntil', addDays(form.date, Number(event.target.value))); }}><option value="7">7 días</option><option value="15">15 días</option><option value="30">30 días</option><option value="custom">Personalizado</option></Select></Field>
            <Field label="Válida hasta"><input type="date" value={form.validUntil} min={form.date} onChange={(event) => onUpdate('validUntil', event.target.value)} required/></Field>
            <Field label="Moneda"><Select value={form.currency} onChange={(event) => onUpdate('currency', event.target.value)}><option value="DOP">DOP · Peso dominicano</option><option value="USD">USD · Dólar estadounidense</option></Select></Field>
          </div>
        </section>}

        {step === 1 && <section className="quote-wizard-panel" aria-labelledby="quote-step-two-title">
          <div className="quote-wizard-panel-heading"><span>DETALLE DE MATERIALES</span><h2 id="quote-step-two-title">¿Qué tela y cuánta necesitas?</h2><p>Escribe un material por línea. La cantidad puede llevar decimales, por ejemplo 1.5 yardas.</p></div>
          <div className="quote-wizard-materials">
            {form.items.map((item, index) => <article className="quote-wizard-material" key={item.id}>
              <div className="quote-wizard-material-heading"><strong>Tela o material {index + 1}</strong><button className="icon-button icon-danger" type="button" onClick={() => onRemoveLine(item.id)} aria-label={`Quitar material ${index + 1}`}><Trash2 size={15}/></button></div>
              <div className="quote-wizard-material-fields">
                <Field label="Nombre de la tela"><input placeholder="Ej. Lycra Everlast" value={item.description} onChange={(event) => onUpdateItem(item.id, 'description', event.target.value)} aria-label={`Nombre del material ${index + 1}`} required/></Field>
                <Field label="Cantidad"><input type="number" min="0.01" step="0.01" inputMode="decimal" enterKeyHint="done" value={Number(item.quantity) > 0 ? item.quantity : ''} placeholder="1" onFocus={(event) => event.currentTarget.select()} onChange={(event) => onUpdateItem(item.id, 'quantity', event.target.value)} aria-label={`Cantidad del material ${index + 1}`} required/></Field>
                <Field label="Unidad de medida"><Select value={item.unit || 'yardas'} onChange={(event) => onUpdateItem(item.id, 'unit', event.target.value)} aria-label={`Unidad del material ${index + 1}`}>{MEASUREMENT_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}</Select></Field>
                <Field label={`Precio por ${selectedUnit(item.unit).label.toLowerCase()}`}><input type="number" min="0" step="0.01" inputMode="decimal" value={item.price} onChange={(event) => onUpdateItem(item.id, 'price', event.target.value)} aria-label={`Precio por unidad del material ${index + 1}`} required/></Field>
                <Field label="Descuento % (opcional)" hint="Solo se aplica a esta tela."><input type="number" min="0" max="100" step="0.01" inputMode="decimal" placeholder="0" value={item.discount} onChange={(event) => onUpdateItem(item.id, 'discount', event.target.value)} aria-label={`Descuento opcional del material ${index + 1}`}/></Field>
              </div>
              <div className="quote-wizard-line-total"><span>{formatQuantity(item.quantity, item.unit || 'yardas')}</span><strong>{formatMoney(lineTotal(item), form.currency)}</strong></div>
            </article>)}
          </div>
          <Button type="button" variant="outline" onClick={onAddLine}><CirclePlus size={16}/> Agregar otra tela</Button>
          {!form.items.length && <p className="quote-wizard-empty-materials">Aún no hay telas. Agrega una para continuar.</p>}
        </section>}

        {step === 2 && <section className="quote-wizard-panel" aria-labelledby="quote-step-three-title">
          <div className="quote-wizard-panel-heading"><span>ÚLTIMO PASO</span><h2 id="quote-step-three-title">Revisa tu cotización</h2><p>Confirma las cantidades y el total. Puedes guardar un borrador si aún te falta algo.</p></div>
          <div className="quote-wizard-review-table"><div className="quote-wizard-review-head"><span>TELA / MATERIAL</span><span>CANTIDAD</span><span>PRECIO / UNIDAD</span><span>TOTAL</span></div>{form.items.map((item) => <div className="quote-wizard-review-row" key={item.id}><strong>{item.description}</strong><span>{formatQuantity(item.quantity, item.unit || 'yardas')}</span><span>{formatMoney(item.price, form.currency)}</span><strong>{formatMoney(lineTotal(item), form.currency)}</strong></div>)}</div>
          <div className="quote-wizard-review-bottom">
            <Field label="Mano de obra obligatoria" hint="Indica un importe mayor que cero."><input type="number" min="0.01" step="0.01" value={form.labor ?? ''} onChange={(event) => onUpdate('labor', event.target.value)} aria-label="Costo de mano de obra" required/></Field>
            <div className="quote-wizard-totals"><div><span>Materiales</span><strong>{formatMoney(totals.subtotal, form.currency)}</strong></div>{totals.discount > 0 && <div><span>Descuento</span><strong>− {formatMoney(totals.discount, form.currency)}</strong></div>}<div><span>Mano de obra</span><strong>{formatMoney(totals.labor, form.currency)}</strong></div><div className="quote-wizard-grand-total"><span>Total</span><strong>{formatMoney(totals.total, form.currency)}</strong></div></div>
          </div>
          <details className="quote-wizard-extras"><summary>Agregar notas, condiciones o fotos (opcional)</summary><div className="quote-wizard-extra-fields"><Field label="Notas para el cliente"><textarea rows="3" placeholder="Escribe aquí cualquier detalle útil." value={form.notes} onChange={(event) => onUpdate('notes', event.target.value)}/></Field><Field label="Términos y condiciones"><textarea rows="3" placeholder="Por ejemplo, vigencia o forma de pago." value={form.terms} onChange={(event) => onUpdate('terms', event.target.value)}/></Field><PhotoAttachments garmentImage={form.garmentImage} detailImages={form.detailImages} onChange={onPhotosChange}/></div></details>
        </section>}
        {(stepError || error) && <div className="quote-wizard-error" role="alert">{stepError || error}</div>}
      </main>

      <footer className="quote-wizard-footer">
        <div>{step === 0 ? <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button> : <Button type="button" variant="ghost" onClick={() => { setStep(step - 1); setStepError(''); }}><ArrowLeft size={16}/> Atrás</Button>}</div>
        {step < steps.length - 1 ? <Button type="button" onClick={advance}>Continuar <ArrowRight size={16}/></Button> : <div className="quote-wizard-final-actions"><Button type="button" variant="outline" disabled={saving} onClick={() => save('draft')}>Guardar borrador</Button><Button type="button" disabled={saving} onClick={() => save(form.status === 'draft' ? 'pending' : form.status)}>{saving ? 'Guardando…' : 'Guardar cotización'} <Check size={16}/></Button></div>}
      </footer>
    </section>
  </div>;

  return createPortal(content, document.body);
}