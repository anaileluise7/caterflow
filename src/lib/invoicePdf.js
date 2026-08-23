import { jsPDF } from 'jspdf';

const gbp = (n) => '£' + (Number(n) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; }
}

function buildInvoiceDoc(inquiry, data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Brand + INVOICE title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text('Saffron & Sage', margin, y);
  doc.setFontSize(26);
  doc.setTextColor(180, 130, 30);
  doc.text('INVOICE', pageWidth - margin, y, { align: 'right' });
  y += 26;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text('Premium catering · London', margin, y);
  y += 18;

  // Invoice meta
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  const invNo = data.invoice_number || `INV-${String(inquiry.id || '').slice(0, 6).toUpperCase()}`;
  doc.text(`Invoice no: ${invNo}`, margin, y);
  doc.text(`Issued: ${fmtDate(new Date().toISOString())}`, margin + 220, y);
  doc.text(`Event date: ${fmtDate(inquiry.event_date)}`, margin + 360, y);
  y += 20;

  // Bill to / Event card
  doc.setDrawColor(225, 225, 225);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, maxWidth, 66, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('BILL TO', margin + 14, y + 18);
  doc.text('EVENT', margin + 260, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(45, 45, 45);
  doc.text(inquiry.name || '—', margin + 14, y + 34);
  doc.text(inquiry.email || '—', margin + 14, y + 48);
  doc.text(inquiry.phone || '—', margin + 14, y + 62);
  doc.text(`${inquiry.event_type || '—'} · ${fmtDate(inquiry.event_date)}`, margin + 260, y + 34);
  doc.text(`Guests: ${inquiry.guest_count || '—'}`, margin + 260, y + 48);
  if (inquiry.venue) {
    const w = doc.splitTextToSize(`Venue: ${inquiry.venue}`, 230);
    doc.text(w, margin + 260, y + 62);
  }
  y += 66 + 22;

  // Line items table
  const colQty = margin + 300;
  const colUnit = margin + 370;
  const colAmt = margin + maxWidth;
  const rowH = 20;

  doc.setFillColor(245, 240, 230);
  doc.roundedRect(margin, y, maxWidth, rowH, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(90, 70, 30);
  doc.text('Description', margin + 10, y + 14);
  doc.text('Qty', colQty, y + 14, { align: 'right' });
  doc.text('Unit Price', colUnit, y + 14, { align: 'right' });
  doc.text('Amount', colAmt - 6, y + 14, { align: 'right' });
  y += rowH;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(45, 45, 45);
  const items = Array.isArray(data.line_items) ? data.line_items : [];
  for (const it of items) {
    if (y > pageHeight - margin - 120) { doc.addPage(); y = margin; }
    const desc = doc.splitTextToSize(String(it.description || ''), 280);
    doc.text(desc, margin + 10, y + 14);
    doc.text(String(it.quantity ?? ''), colQty, y + 14, { align: 'right' });
    doc.text(gbp(it.unit_price), colUnit, y + 14, { align: 'right' });
    doc.text(gbp(it.amount), colAmt - 6, y + 14, { align: 'right' });
    y += rowH;
    doc.setDrawColor(235, 235, 235);
    doc.line(margin, y, margin + maxWidth, y);
  }

  // Totals
  y += 8;
  const subtotal = Number(data.subtotal) || 0;
  const taxRate = Number(data.tax_rate) || 0;
  const taxAmount = Number(data.tax_amount) || 0;
  const total = Number(data.total) || (subtotal + taxAmount);
  const labelX = margin + maxWidth - 170;
  const valueX = margin + maxWidth - 6;
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text('Subtotal', labelX, y + 14, { align: 'right' });
  doc.text(gbp(subtotal), valueX, y + 14, { align: 'right' });
  y += rowH;
  const vatPct = taxRate > 1 ? taxRate : Math.round(taxRate * 100);
  doc.text(`VAT (${vatPct}%)`, labelX, y + 14, { align: 'right' });
  doc.text(gbp(taxAmount), valueX, y + 14, { align: 'right' });
  y += rowH;
  doc.setDrawColor(225, 225, 225);
  doc.line(labelX, y, valueX, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Total Due', labelX, y + 16, { align: 'right' });
  doc.text(gbp(total), valueX, y + 16, { align: 'right' });
  y += 30;

  // Payment terms + notes
  if (y > pageHeight - margin - 80) { doc.addPage(); y = margin; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('PAYMENT TERMS', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(45, 45, 45);
  const terms = doc.splitTextToSize(data.payment_terms || 'Payment due within 14 days of invoice date. Bank transfer details available on request.', maxWidth);
  doc.text(terms, margin, y);
  y += terms.length * 14 + 8;

  if (data.notes) {
    if (y > pageHeight - margin - 40) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('NOTES', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(45, 45, 45);
    const notes = doc.splitTextToSize(data.notes, maxWidth);
    doc.text(notes, margin, y);
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(170, 170, 170);
    doc.text('Saffron & Sage  ·  Thank you for your business', margin, pageHeight - 18);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
  }

  return doc;
}

export function downloadInvoicePdf(inquiry, data) {
  const doc = buildInvoiceDoc(inquiry, data || {});
  const safeName = (inquiry.name || 'invoice').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'invoice';
  doc.save(`invoice_${safeName}.pdf`);
}

export function printInvoicePdf(inquiry, data) {
  const doc = buildInvoiceDoc(inquiry, data || {});
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}