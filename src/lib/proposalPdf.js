import { jsPDF } from 'jspdf';

function cleanLine(line) {
  let l = line.replace(/\*\*/g, '').replace(/__/g, '').replace(/`/g, '').replace(/\*/g, '');
  l = l.replace(/^[-*]\s+/, '• ');
  return l.trim();
}

export function downloadProposalPdf(inquiry) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text('Saffron & Sage', margin, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(140, 140, 140);
  doc.text('Catering Proposal', margin, y + 8);
  y += 30;

  // Event info card
  doc.setDrawColor(225, 225, 225);
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, maxWidth, 74, 6, 6, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(70, 70, 70);
  const info = [
    `Client:  ${inquiry.name || '—'}`,
    `Event:   ${inquiry.event_type || '—'}     Date: ${inquiry.event_date || '—'}`,
    `Guests:  ${inquiry.guest_count || '—'}     Venue: ${inquiry.venue || '—'}`,
  ];
  let iy = y + 20;
  for (const line of info) {
    doc.text(line, margin + 14, iy);
    iy += 18;
  }
  y += 74 + 22;

  // Proposal body
  const rawLines = (inquiry.proposal || '').split('\n');
  for (const raw of rawLines) {
    if (raw.trim() === '' || /^[-=]{3,}$/.test(raw.trim())) {
      y += 8;
      continue;
    }
    const heading = raw.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = cleanLine(heading[2]);
      const size = level <= 2 ? 15 : 12;
      if (y > pageHeight - margin) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      doc.setTextColor(30, 30, 30);
      const wrapped = doc.splitTextToSize(text, maxWidth);
      for (const w of wrapped) {
        if (y > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.text(w, margin, y);
        y += size + 6;
      }
      y += 4;
      continue;
    }
    const text = cleanLine(raw);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(45, 45, 45);
    const wrapped = doc.splitTextToSize(text, maxWidth);
    for (const w of wrapped) {
      if (y > pageHeight - margin) { doc.addPage(); y = margin; }
      doc.text(w, margin, y);
      y += 15;
    }
  }

  // Footer page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(170, 170, 170);
    doc.text(`Saffron & Sage  ·  Page ${i} of ${pageCount}`, margin, pageHeight - 18);
  }

  const safeName = (inquiry.name || 'proposal').replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'proposal';
  doc.save(`proposal_${safeName}.pdf`);
}