import { useRef, useState } from 'react';
import { ImagePlus, Images, Shirt, Trash2, Upload } from 'lucide-react';
import { Card } from './ui.jsx';

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer esa imagen.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
      image.onload = () => resolve(image);
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function resizeForQuote(file, maxSide, maxBytes) {
  if (!file?.type.startsWith('image/')) throw new Error('Selecciona una imagen JPG, PNG o WebP.');
  if (file.size > 8 * 1024 * 1024) throw new Error('La imagen original no puede superar 8 MB.');
  const image = await readImage(file);
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.8;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > maxBytes && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > maxBytes) throw new Error('La imagen tiene demasiado detalle. Elige una imagen más pequeña.');
  return dataUrl;
}

function PhotoSlot({ title, image, icon: Icon, onChoose, onRemove, inputRef, disabled, hint }) {
  return <div className={`photo-slot ${image ? 'photo-slot-filled' : ''}`}>
    {image ? <><img className="photo-thumb" src={image} alt={title}/><button className="photo-remove" type="button" onClick={onRemove} aria-label={`Quitar ${title}`}><Trash2 size={14}/></button></> : <button className="photo-empty" type="button" onClick={() => inputRef.current?.click()} disabled={disabled}><span><Icon size={19}/></span><strong>{title}</strong><small>{hint}</small><em><Upload size={13}/> Seleccionar imagen</em></button>}
    <input ref={inputRef} className="photo-file-input" type="file" accept="image/*" aria-label={title} onChange={onChoose}/>
  </div>;
}

export default function PhotoAttachments({ garmentImage, detailImages = [], onChange }) {
  const garmentInput = useRef(null);
  const detailInput = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pickGarment = async (event) => {
    const [file] = event.target.files || [];
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError('');
    try { onChange({ garmentImage: await resizeForQuote(file, 1500, 720000) }); }
    catch (exception) { setError(exception.message); }
    finally { setBusy(false); }
  };

  const pickDetails = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 2 - detailImages.length);
    event.target.value = '';
    if (!files.length) return;
    setBusy(true); setError('');
    try {
      const prepared = await Promise.all(files.map((file) => resizeForQuote(file, 800, 360000)));
      onChange({ detailImages: [...detailImages, ...prepared].slice(0, 2) });
    } catch (exception) { setError(exception.message); }
    finally { setBusy(false); }
  };

  const setDetail = (index, value) => onChange({ detailImages: detailImages.map((image, current) => current === index ? value : image).filter(Boolean) });

  return <Card className="form-section photo-attachments"><div className="form-section-title"><span className="section-icon"><Images size={18}/></span><div><h2>Diseño y materiales <span className="optional-tag">OPCIONAL</span></h2><p>Adjunta una referencia del vestido y hasta dos fotos de telas, pedrería o detalles.</p></div></div>
    <div className="photo-layout"><div className="photo-primary-column"><span className="photo-section-label">REFERENCIA DEL VESTIDO</span><PhotoSlot title="Imagen del vestido" hint="Una foto, hasta 8 MB" icon={Shirt} image={garmentImage} inputRef={garmentInput} disabled={busy} onChoose={pickGarment} onRemove={() => onChange({ garmentImage: '' })}/></div>
      <div className="photo-detail-column"><span className="photo-section-label">MATERIALES / DETALLES <small>{detailImages.length}/2</small></span><div className="detail-photo-grid">{detailImages.map((image, index) => <PhotoSlot key={`${index}-${image.slice(-20)}`} title={`Detalle ${index + 1}`} hint="Foto de material" icon={ImagePlus} image={image} inputRef={{ current: null }} disabled={busy} onRemove={() => setDetail(index, '')} onChoose={async(event) => { const [file] = event.target.files || []; event.target.value = ''; if (!file) return; setBusy(true); setError(''); try { setDetail(index, await resizeForQuote(file, 800, 360000)); } catch (exception) { setError(exception.message); } finally { setBusy(false); } }}/>)}</div>
        {detailImages.length < 2 && <button type="button" className="add-detail-photo" onClick={() => detailInput.current?.click()} disabled={busy}><ImagePlus size={15}/> Añadir foto de material</button>}
        <input ref={detailInput} className="photo-file-input" type="file" accept="image/*" multiple aria-label="Añadir imágenes de materiales" onChange={pickDetails}/>
      </div>
    </div>
    {busy && <p className="photo-hint">Preparando imágenes para el PDF…</p>}{error && <p className="photo-error" role="alert">{error}</p>}
  </Card>;
}
