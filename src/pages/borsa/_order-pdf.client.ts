// Renders the order PDF with jsPDF. Loaded only by a dynamic import on tap
// (see _order-page.client.ts), so /borsa's entry script never carries jsPDF.
import { jsPDF } from 'jspdf';
import { orderPdf, type OrderPdf, type OrderPdfInput } from '~/lib/order-pdf';

const MARGIN = 18;
const AMOUNT_COL = 35;

/** Draws the blocks on A4 portrait, Helvetica only (WinAnsi text, see pdfText). */
export function renderOrderPdf(pdf: OrderPdf): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  doc.setProperties({ title: pdf.title });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const width = pageW - MARGIN * 2;
  let y = MARGIN;

  const font = (style: 'normal' | 'bold', size: number, grey = 0) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(grey);
  };
  const lineH = (size: number) => size * 0.3528 * 1.35;
  // Starts a new page when the next block would cross the bottom margin.
  const room = (h: number) => {
    if (y + h > pageH - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  for (const b of pdf.blocks) {
    switch (b.kind) {
      case 'brand': {
        font('bold', 18);
        room(lineH(18));
        y += lineH(18) * 0.8;
        doc.text(b.text, MARGIN, y);
        y += lineH(18) * 0.4;
        break;
      }
      case 'heading': {
        font('bold', 12);
        y += 5;
        room(lineH(12) + 2 + lineH(10));
        y += lineH(12) * 0.8;
        doc.text(b.text, MARGIN, y);
        y += lineH(12) * 0.4;
        break;
      }
      case 'text':
      case 'meta': {
        font('normal', 10, b.kind === 'meta' ? 90 : 0);
        const lines: string[] = doc.splitTextToSize(b.text, width);
        for (const l of lines) {
          room(lineH(10));
          y += lineH(10);
          doc.text(l, MARGIN, y - lineH(10) * 0.25);
        }
        break;
      }
      case 'row': {
        font('normal', 10);
        const lines: string[] = doc.splitTextToSize(b.text, width - AMOUNT_COL);
        room(lineH(10) * lines.length);
        lines.forEach((l, i) => {
          y += lineH(10);
          doc.text(l, MARGIN, y - lineH(10) * 0.25);
          if (i === 0 && b.right) {
            doc.text(b.right, pageW - MARGIN, y - lineH(10) * 0.25, { align: 'right' });
          }
        });
        break;
      }
      case 'total': {
        font('bold', 12);
        room(lineH(12) + 2);
        y += 2 + lineH(12);
        doc.text(b.text, MARGIN, y - lineH(12) * 0.25);
        if (b.right) doc.text(b.right, pageW - MARGIN, y - lineH(12) * 0.25, { align: 'right' });
        break;
      }
      case 'rule': {
        room(3);
        y += 1.5;
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.line(MARGIN, y, pageW - MARGIN, y);
        y += 1.5;
        break;
      }
    }
  }
  return doc;
}

/** Builds the PDF of the request and hands it to the browser as a download. */
export function saveOrderPdf(input: OrderPdfInput): void {
  const pdf = orderPdf(input);
  renderOrderPdf(pdf).save(pdf.filename);
}
