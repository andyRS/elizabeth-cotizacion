import { useEffect, useRef } from 'react';
import { ArrowRight, Ruler, UserRound, WalletCards, X } from 'lucide-react';
import '../styles/new-quote-start-modal.css';

export default function NewQuoteStartModal({ onClose, onCancel }) {
  const startButton = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    startButton.current?.focus();
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose]);

  return <div className="dialog-backdrop quote-start-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="quote-start-modal" role="dialog" aria-modal="true" aria-labelledby="quote-start-title" aria-describedby="quote-start-description">
      <div className="quote-start-topline">
        <span className="quote-start-mark"><Ruler size={21}/></span>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={19}/></button>
      </div>
      <div className="quote-start-intro">
        <span className="eyebrow">NUEVA COTIZACIÓN</span>
        <h2 id="quote-start-title">Vamos paso a paso</h2>
        <p id="quote-start-description">Preparar el precio de una tela es sencillo. Te guiaremos para completar cada parte.</p>
      </div>
      <ol className="quote-start-steps">
        <li><span className="quote-start-step-icon"><UserRound size={17}/></span><div><strong>Elige a tu cliente</strong><p>Selecciona quién recibirá esta cotización.</p></div></li>
        <li><span className="quote-start-step-icon"><Ruler size={17}/></span><div><strong>Agrega la tela y la medida</strong><p>Escribe el material, la cantidad y su unidad, como yardas o metros.</p></div></li>
        <li><span className="quote-start-step-icon"><WalletCards size={17}/></span><div><strong>Indica el precio y revisa</strong><p>Verás el total antes de guardar o descargar el documento.</p></div></li>
      </ol>
      <div className="quote-start-note">Puedes guardar un borrador y completar los detalles después.</div>
      <div className="quote-start-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Ahora no</button>
        <button ref={startButton} type="button" className="btn btn-primary" onClick={onClose}>Empezar cotización <ArrowRight size={16}/></button>
      </div>
    </section>
  </div>;
}