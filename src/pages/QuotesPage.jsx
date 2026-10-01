import { useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { Copy, Download, Eye, FilePlus2, MoreHorizontal, Pencil, Printer, Search, Trash2 } from 'lucide-react';
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, SearchInput, Select } from '../components/ui.jsx';
import { dataStore } from '../services/dataStore.js';
import { downloadQuotePdf } from '../services/pdfService.js';
import { formatDate, formatMoney, statusForDisplay } from '../utils/quoteUtils.js';

const statuses = [['all','Todos los estados'],['draft','Borrador'],['pending','Pendiente'],['sent','Enviada'],['approved','Aprobada'],['rejected','Rechazada'],['expired','Vencida']];
export default function QuotesPage() {
  const [searchParams] = useSearchParams();
  const [quotes, setQuotes] = useState(() => dataStore.quotes.list());
  const clients = dataStore.clients.list();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [clientId, setClientId] = useState(() => searchParams.get('cliente') || 'all');
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');
  const [deleting, setDeleting] = useState(null);
  const { notify } = useOutletContext();
  const visible = useMemo(() => quotes.filter((quote) => {
    const client = clients.find((entry) => entry.id === quote.clientId);
    const text = `${quote.number} ${client?.name||''} ${client?.businessName||''}`.toLocaleLowerCase();
    const actualStatus = statusForDisplay(quote);
    return text.includes(search.toLocaleLowerCase()) && (status === 'all' || actualStatus === status) && (clientId === 'all' || quote.clientId === clientId) && (!from || quote.date >= from) && (!until || quote.date <= until);
  }).sort((a,b)=>b.date.localeCompare(a.date)),[quotes, clients, search, status, clientId, from, until]);
  const refresh = () => setQuotes(dataStore.quotes.list());
  const setQuoteStatus = (quote, nextStatus) => { dataStore.quotes.save({ ...quote, status: nextStatus }); refresh(); notify('Estado de cotización actualizado.'); };
  const remove = () => { dataStore.quotes.remove(deleting.id); setDeleting(null); refresh(); notify('Cotización eliminada.'); };
  const print = (quote) => { window.location.href = `/cotizaciones/${quote.id}?print=1`; };
  return <><PageHeader eyebrow="COSTURA Y CONFECCIÓN" title="Cotizaciones" description={`${quotes.length} ${quotes.length===1?'cotización creada':'cotizaciones creadas'} · Organiza tus prendas, confecciones y arreglos.`} action={<Link className="btn btn-primary" to="/cotizaciones/nueva"><FilePlus2 size={17}/> Nueva cotización</Link>}/>
    <Card className="table-card"><div className="table-toolbar"><SearchInput value={search} onChange={setSearch} placeholder="Buscar cotización o cliente..."/><div className="filter-row"><Select value={status} onChange={(e)=>setStatus(e.target.value)} aria-label="Filtrar por estado">{statuses.map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select><Select value={clientId} onChange={(e)=>setClientId(e.target.value)} aria-label="Filtrar por cliente"><option value="all">Todos los clientes</option>{clients.map((client)=><option key={client.id} value={client.id}>{client.businessName||client.name}</option>)}</Select><label className="date-filter"><span>Desde</span><input aria-label="Fecha desde" type="date" value={from} onChange={(e)=>setFrom(e.target.value)}/></label><label className="date-filter"><span>Hasta</span><input aria-label="Fecha hasta" type="date" value={until} onChange={(e)=>setUntil(e.target.value)}/></label></div></div>
      {visible.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>NÚMERO</th><th>CLIENTE</th><th>FECHA</th><th>VÁLIDA HASTA</th><th className="align-right">MONTO</th><th>MONEDA</th><th>ESTADO</th><th className="align-right">ACCIONES</th></tr></thead><tbody>{visible.map((quote)=>{const client=clients.find((entry)=>entry.id===quote.clientId);const displayStatus=statusForDisplay(quote);return <tr key={quote.id}><td><Link className="table-primary" to={`/cotizaciones/${quote.id}`}>{quote.number}</Link></td><td><div className="client-cell"><span className="table-avatar">{(client?.businessName||client?.name||'?').slice(0,1).toUpperCase()}</span><span><strong>{client?.businessName||client?.name||'Cliente eliminado'}</strong><small>{client?.name}</small></span></div></td><td>{formatDate(quote.date)}</td><td>{formatDate(quote.validUntil)}</td><td className="align-right amount-cell">{formatMoney(quote.total,quote.currency)}</td><td><span className="currency-pill">{quote.currency}</span></td><td><Select className={`status-select status-select-${displayStatus}`} value={displayStatus} onChange={(e)=>setQuoteStatus(quote,e.target.value)} aria-label={`Cambiar estado de ${quote.number}`}>{statuses.slice(1).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></td><td><div className="row-actions"><Link className="icon-button" title="Ver cotización" aria-label="Ver cotización" to={`/cotizaciones/${quote.id}`}><Eye size={16}/></Link><Link className="icon-button" title="Editar" aria-label="Editar" to={`/cotizaciones/${quote.id}/editar`}><Pencil size={15}/></Link><Link className="icon-button" title="Duplicar" aria-label="Duplicar" to={`/cotizaciones/nueva?duplicate=${quote.id}`}><Copy size={15}/></Link><button className="icon-button" title="Descargar PDF" aria-label="Descargar PDF" onClick={()=>downloadQuotePdf(quote,client)}><Download size={15}/></button><button className="icon-button" title="Imprimir" aria-label="Imprimir" onClick={()=>print(quote)}><Printer size={15}/></button><button className="icon-button icon-danger" title="Eliminar" aria-label="Eliminar" onClick={()=>setDeleting(quote)}><Trash2 size={15}/></button></div></td></tr>;})}</tbody></table></div>:<EmptyState icon={Search} title={quotes.length?'No encontramos resultados':'Tu historial comienza aquí'} description={quotes.length?'Prueba con otro término o ajusta los filtros.':'Crea una cotización para tus trabajos de costura y aparecerá en este historial.'} action={!quotes.length&&<Link to="/cotizaciones/nueva"><Button><FilePlus2 size={16}/> Nueva cotización</Button></Link>}/>}
      <div className="table-footer"><span>Mostrando <strong>{visible.length}</strong> de <strong>{quotes.length}</strong> cotizaciones</span><span><MoreHorizontal size={16}/> Datos guardados localmente</span></div>
    </Card>{deleting&&<ConfirmDialog title="¿Eliminar cotización?" message={`La cotización ${deleting.number} se eliminará permanentemente. Esta acción no se puede deshacer.`} onCancel={()=>setDeleting(null)} onConfirm={remove}/>}
  </>;
}
