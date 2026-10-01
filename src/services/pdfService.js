import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dataStore } from './dataStore.js';
import { formatDate, formatMoney, quoteTotals } from '../utils/quoteUtils.js';

export function createQuotePdf(quote, client) {
  const settings = dataStore.settings.get();
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const green = [63, 81, 43];
  const olive = [102, 122, 62];
  const totals = quoteTotals(quote.items);
  doc.setFillColor(...green);
  doc.rect(0, 0, 210, 48, 'F');
  if (settings.logo?.startsWith('data:image/')) {
    const imageType = settings.logo.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
    try { doc.addImage(settings.logo, imageType, 14, 10, 22, 22, undefined, 'FAST'); } catch { /* Logo no compatible: se conserva el documento */ }
  }
  const left = settings.logo ? 42 : 15;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.businessName || 'Elizabeth Méndez', left, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text([settings.tradeName, settings.taxId && `RNC/Cédula: ${settings.taxId}`, settings.phone, settings.email].filter(Boolean), left, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('COTIZACIÓN', 195, 17, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(quote.number, 195, 24, { align: 'right' });
  doc.setTextColor(28, 36, 25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CLIENTE', 15, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const clientLines = [client?.businessName, client?.name, client?.taxId && `RNC/Cédula: ${client.taxId}`, client?.phone, client?.email, client?.address, client?.city].filter(Boolean);
  doc.text(clientLines, 15, 69);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA', 145, 62);
  doc.text('VÁLIDA HASTA', 145, 76);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(quote.date), 195, 62, { align: 'right' });
  doc.text(formatDate(quote.validUntil), 195, 76, { align: 'right' });
  autoTable(doc, {
    startY: 99,
    head: [['Descripción', 'Cant.', 'Precio', 'Desc. %', 'Imp. %', 'Total']],
    body: quote.items.map((item) => {
      const base = Number(item.quantity) * Number(item.price);
      const discount = base * Number(item.discount || 0) / 100;
      const tax = (base - discount) * Number(item.tax || 0) / 100;
      return [item.description, item.quantity, formatMoney(item.price, quote.currency), `${Number(item.discount || 0)}%`, `${Number(item.tax || 0)}%`, formatMoney(base - discount + tax, quote.currency)];
    }),
    theme: 'grid',
    headStyles: { fillColor: green, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 248, 243] },
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 3.2, textColor: [28, 36, 25] },
    columnStyles: { 0: { cellWidth: 65 }, 1: { halign: 'center' }, 5: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 15, right: 15 },
  });
  let y = doc.lastAutoTable.finalY + 9;
  const addTotal = (label, value, emph = false) => {
    if (y > 265) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', emph ? 'bold' : 'normal');
    doc.setFontSize(emph ? 12 : 9);
    doc.setTextColor(...(emph ? green : [70, 78, 66]));
    doc.text(label, 145, y);
    doc.text(formatMoney(value, quote.currency), 195, y, { align: 'right' });
    y += emph ? 9 : 6;
  };
  addTotal('Subtotal', totals.subtotal);
  addTotal('Descuento', -totals.discount);
  addTotal('Impuestos', totals.tax);
  doc.setDrawColor(...olive);
  doc.line(140, y - 2, 195, y - 2);
  y += 3;
  addTotal('TOTAL', totals.total, true);
  const addCopy = (title, text) => {
    if (!text) return;
    if (y > 255) { doc.addPage(); y = 20; }
    doc.setTextColor(...green);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, 15, y + 3);
    doc.setTextColor(70, 78, 66);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 15, y + 9);
    y += 13 + lines.length * 4;
  };
  addCopy('Notas', quote.notes);
  addCopy('Términos y condiciones', quote.terms);
  return doc;
}

export function quotePdfFileName(quote, client) {
  const slug = (client?.businessName || client?.name || 'Cliente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `Cotizacion-${quote.number}-${slug}.pdf`;
}

export function downloadQuotePdf(quote, client) {
  createQuotePdf(quote, client).save(quotePdfFileName(quote, client));
}

export function printQuote() { window.print(); }
