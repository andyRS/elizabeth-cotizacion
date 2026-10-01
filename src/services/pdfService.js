import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dataStore } from './dataStore.js';
import { formatDate, formatMoney, formatQuantity, quoteTotals } from '../utils/quoteUtils.js';

const GREEN = [22, 112, 58];
const DARK_GREEN = [16, 83, 47];
const PALE_GREEN = [230, 244, 234];
const LIGHT_GREEN = [203, 229, 210];
const INK = [34, 42, 36];
const MUTED = [97, 111, 101];

function imageType(dataUrl) {
  if (dataUrl?.startsWith('data:image/png')) return 'PNG';
  if (dataUrl?.startsWith('data:image/jpeg')) return 'JPEG';
  return null;
}

function addCoverImage(doc, dataUrl, x, y, width, height) {
  const type = imageType(dataUrl);
  if (!type) return false;
  try {
    const props = doc.getImageProperties(dataUrl);
    const ratio = Math.min(width / props.width, height / props.height);
    const imageWidth = props.width * ratio;
    const imageHeight = props.height * ratio;
    doc.addImage(dataUrl, type, x + (width - imageWidth) / 2, y + (height - imageHeight) / 2, imageWidth, imageHeight, undefined, 'FAST');
    return true;
  } catch {
    return false;
  }
}

function outlinedBox(doc, x, y, width, height, radius = 3) {
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.45);
  doc.roundedRect(x, y, width, height, radius, radius, 'S');
}

async function createBrandWordmark(text) {
  if (typeof document === 'undefined') return null;
  try {
    await document.fonts.load('700 156px "Manrope"');
    const canvas = document.createElement('canvas');
    canvas.width = 1150;
    canvas.height = 260;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = `rgb(${GREEN.join(',')})`;
    context.textAlign = 'left';
    context.textBaseline = 'middle';
    context.font = '700 156px "Manrope"';
    context.fillText(text, 8, 132, canvas.width - 16);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

async function printHeader(doc, quote, client, settings) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const wordmark = await createBrandWordmark('EatelierM');
  if (!addCoverImage(doc, wordmark, 16, 7, 83, 25)) {
    doc.setTextColor(...GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(23);
    doc.text('EatelierM', 16, 24);
  }
  doc.setTextColor(...DARK_GREEN);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('C O T I Z A C I Ó N', 17, 34);
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.8);
  doc.line(16, 37, 99, 37);
  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(settings.businessName || 'Elizabeth Méndez', 17, 42);
  doc.text(settings.phone || settings.email || 'Costura y confección', 17, 46);

  const boxX = pageWidth - 83;
  const boxY = 10;
  outlinedBox(doc, boxX, boxY, 67, 37, 3);
  const rows = [
    ['Cliente', client?.businessName || client?.name || 'Cliente'],
    ['Fecha', formatDate(quote.date)],
    ['N.º cotización', quote.number],
  ];
  rows.forEach(([label, value], index) => {
    const y = boxY + 8 + index * 12;
    if (index > 0) {
      doc.setDrawColor(...LIGHT_GREEN);
      doc.setLineWidth(0.3);
      doc.line(boxX + 5, y - 3.5, boxX + 62, y - 3.5);
    }
    doc.setTextColor(...GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(label, boxX + 5, y);
    doc.setTextColor(...INK);
    doc.setFont('times', 'italic');
    doc.setFontSize(value.length > 23 ? 8.5 : 10);
    doc.text(doc.splitTextToSize(value, 37)[0], boxX + 28, y, { maxWidth: 36 });
  });
}

export async function createQuotePdf(quote, client, settingsOverride) {
  const settings = settingsOverride || await dataStore.settings.get();
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totals = quoteTotals(quote.items, quote.labor);
  await printHeader(doc, quote, client, settings);

  autoTable(doc, {
    startY: 53,
    head: [['Cantidad', 'Materiales', 'Precio unitario', 'Precio material']],
    body: quote.items.map((item) => {
      const base = Number(item.quantity) * Number(item.price);
      const discount = base * Number(item.discount || 0) / 100;
      return [formatQuantity(item.quantity, item.unit || 'yardas'), item.description, formatMoney(item.price, quote.currency), formatMoney(base - discount, quote.currency)];
    }),
    theme: 'grid',
    headStyles: { fillColor: GREEN, textColor: 255, font: 'helvetica', fontStyle: 'bold', fontSize: 9, cellPadding: 3.5 },
    alternateRowStyles: { fillColor: [247, 251, 247] },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3, textColor: INK, lineColor: LIGHT_GREEN, lineWidth: 0.25, minCellHeight: 10, overflow: 'linebreak' },
    columnStyles: { 0: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 15, right: 15 },
  });

  const summaryRows = [
    ['Total de material', totals.subtotal],
    ...(totals.discount ? [['Descuento', -totals.discount]] : []),
    ['Mano de obra', totals.labor],
    ['TOTAL', totals.total],
  ];
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    body: summaryRows.map(([label, amount]) => [label, formatMoney(amount, quote.currency)]),
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 2, textColor: INK, lineColor: LIGHT_GREEN, lineWidth: 0.25 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: pageWidth - 15 - 88, right: 15 },
    didParseCell(data) {
      if (data.row.index === summaryRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = DARK_GREEN;
        data.cell.styles.fillColor = PALE_GREEN;
        data.cell.styles.fontSize = 12;
      }
    },
  });

  const hasPhotos = Boolean(quote.garmentImage || quote.detailImages?.length);
  const photoSectionHeight = hasPhotos ? 72 : 0;
  let photoY = doc.lastAutoTable.finalY + 8;
  if (hasPhotos && photoY + photoSectionHeight > pageHeight - 13) {
    doc.addPage();
    photoY = 17;
  }

  if (hasPhotos) {
    const leftX = 15;
    const leftWidth = 92;
    const rightX = 114;
    const rightWidth = pageWidth - rightX - 15;
    doc.setTextColor(...GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('DISEÑO DEL VESTIDO', leftX + 1, photoY);
    outlinedBox(doc, leftX, photoY + 3, leftWidth, 67, 2.5);
    if (!addCoverImage(doc, quote.garmentImage, leftX + 2, photoY + 5, leftWidth - 4, 63)) {
      doc.setTextColor(...MUTED);
      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.text('Referencia no adjunta', leftX + leftWidth / 2, photoY + 39, { align: 'center' });
    }
    doc.setTextColor(...GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('MATERIALES / DETALLES', rightX + 1, photoY);
    const detailY = photoY + 3;
    const detailWidth = (rightWidth - 3) / 2;
    [0, 1].forEach((index) => {
      const x = rightX + index * (detailWidth + 3);
      if (quote.detailImages?.[index]) {
        outlinedBox(doc, x, detailY, detailWidth, 64, 2);
        addCoverImage(doc, quote.detailImages[index], x + 1.5, detailY + 1.5, detailWidth - 3, 61);
      }
    });
  }

  const termsY = (hasPhotos ? photoY + photoSectionHeight : doc.lastAutoTable.finalY + 8) + 4;
  if (quote.notes || quote.terms) {
    if (termsY > pageHeight - 28) doc.addPage();
    let y = termsY > pageHeight - 28 ? 18 : termsY;
    for (const [label, text] of [['Notas', quote.notes], ['Términos y condiciones', quote.terms]]) {
      if (!text) continue;
      doc.setTextColor(...GREEN);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(label, 15, y);
      doc.setTextColor(...MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(text, pageWidth - 30);
      doc.text(lines, 15, y + 4);
      y += 6 + lines.length * 3.5;
      if (y > pageHeight - 12 && label === 'Notas' && quote.terms) { doc.addPage(); y = 18; }
    }
  }
  return doc;
}

export function quotePdfFileName(quote, client) {
  const slug = (client?.businessName || client?.name || 'Cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `Cotizacion-EATELIERM-${quote.number}-${slug}.pdf`;
}

export async function downloadQuotePdf(quote, client) {
  const doc = await createQuotePdf(quote, client);
  doc.save(quotePdfFileName(quote, client));
}

export function printQuote() { window.print(); }
