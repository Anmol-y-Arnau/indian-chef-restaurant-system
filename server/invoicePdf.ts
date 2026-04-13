import { jsPDF } from 'jspdf';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  invoiceNumber: string;
  customer: {
    name: string;
    nif: string;
    address: string;
    city: string;
    email?: string | null;
    phone?: string | null;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  tableId?: string;
  notes?: string;
  createdAt?: Date;
  // Restaurant data (configurable per installation)
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantNif?: string;
  restaurantPhone?: string;
}

/**
 * Normaliza caracteres especiales que jsPDF/Helvetica no soporta bien.
 */
function normalizeText(text: string): string {
  return text
    .replace(/á/g, 'a').replace(/Á/g, 'A')
    .replace(/é/g, 'e').replace(/É/g, 'E')
    .replace(/í/g, 'i').replace(/Í/g, 'I')
    .replace(/ó/g, 'o').replace(/Ó/g, 'O')
    .replace(/ú/g, 'u').replace(/Ú/g, 'U')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/¡/g, '!').replace(/¿/g, '?')
    .replace(/«/g, '"').replace(/»/g, '"')
    .replace(/€/g, 'EUR');
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = doc.getTextWidth(testLine);
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

export function generateInvoicePDF(data: InvoiceData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginLeft = 20;
  const marginRight = 190;
  const pageWidth = 210;

  const restaurantName = data.restaurantName || 'INDIAN CHEF';
  const restaurantAddress = data.restaurantAddress || 'C/ Lasauca, 18 Bs, 17600 Figueres (Girona)';
  const restaurantNif = data.restaurantNif || 'NIF: B24897415';
  const restaurantPhone = data.restaurantPhone || 'Tel: 972 50 00 00';

  const invoiceDate = data.createdAt ? new Date(data.createdAt) : new Date();
  const dateStr = invoiceDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  doc.setFont('helvetica');

  // ── ENCABEZADO RESTAURANTE ────────────────────────────────────
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(normalizeText(restaurantName), marginLeft, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(normalizeText(restaurantAddress), marginLeft, 29);
  doc.text(normalizeText(restaurantNif), marginLeft, 34);
  doc.text(normalizeText(restaurantPhone), marginLeft, 39);
  doc.setTextColor(0, 0, 0);

  // ── TÍTULO FACTURA (derecha) ──────────────────────────────────
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 80, 0);
  doc.text('FACTURA', marginRight, 22, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`No: ${data.invoiceNumber}`, marginRight, 30, { align: 'right' });
  doc.text(`Fecha: ${dateStr}`, marginRight, 36, { align: 'right' });
  if (data.tableId) {
    doc.text(normalizeText(`Mesa: ${data.tableId}`), marginRight, 42, { align: 'right' });
  }

  // ── LÍNEA SEPARADORA ─────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, 48, marginRight, 48);

  // ── DATOS DEL CLIENTE ────────────────────────────────────────
  let yPos = 56;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(marginLeft, yPos - 5, (marginRight - marginLeft), 36, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(120, 120, 120);
  doc.text('FACTURAR A:', marginLeft + 4, yPos);
  doc.setTextColor(0, 0, 0);

  yPos += 6;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(normalizeText(data.customer.name), marginLeft + 4, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIF/CIF: ${data.customer.nif}`, marginLeft + 4, yPos);

  yPos += 5;
  doc.text(normalizeText(data.customer.address), marginLeft + 4, yPos);

  yPos += 5;
  doc.text(normalizeText(data.customer.city), marginLeft + 4, yPos);

  if (data.customer.email || data.customer.phone) {
    yPos += 5;
    const contactParts = [];
    if (data.customer.phone) contactParts.push(`Tel: ${data.customer.phone}`);
    if (data.customer.email) contactParts.push(data.customer.email);
    doc.text(normalizeText(contactParts.join('  |  ')), marginLeft + 4, yPos);
  }

  // ── TABLA DE ITEMS ────────────────────────────────────────────
  yPos += 14;

  // Cabecera de tabla
  doc.setFillColor(40, 40, 40);
  doc.rect(marginLeft, yPos - 5, marginRight - marginLeft, 8, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPCION', marginLeft + 4, yPos);
  doc.text('CANT.', marginLeft + 110, yPos, { align: 'center' });
  doc.text('P. UNIT.', marginLeft + 135, yPos, { align: 'center' });
  doc.text('TOTAL', marginRight - 2, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  yPos += 8;

  // Items
  doc.setFont('helvetica', 'normal');
  let rowAlt = false;
  for (const item of data.items) {
    const nameLines = wrapText(doc, normalizeText(item.name), 95);
    const rowHeight = Math.max(7, nameLines.length * 5 + 2);

    if (rowAlt) {
      doc.setFillColor(252, 248, 243);
      doc.rect(marginLeft, yPos - 4, marginRight - marginLeft, rowHeight, 'F');
    }
    rowAlt = !rowAlt;

    doc.setFontSize(9);
    for (let i = 0; i < nameLines.length; i++) {
      doc.text(nameLines[i], marginLeft + 4, yPos + i * 5);
    }
    doc.text(`${item.quantity}`, marginLeft + 110, yPos, { align: 'center' });
    doc.text(`${item.unitPrice.toFixed(2)} EUR`, marginLeft + 135, yPos, { align: 'center' });
    doc.text(`${item.total.toFixed(2)} EUR`, marginRight - 2, yPos, { align: 'right' });

    yPos += rowHeight;

    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
  }

  // ── LÍNEA FINAL TABLA ─────────────────────────────────────────
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos, marginRight, yPos);

  // ── TOTALES ───────────────────────────────────────────────────
  yPos += 8;
  const totalsX = marginLeft + 100;
  const totalsValueX = marginRight;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Base imponible:', totalsX, yPos);
  doc.text(`${data.subtotal.toFixed(2)} EUR`, totalsValueX, yPos, { align: 'right' });

  yPos += 6;
  doc.text(`IVA (${data.taxRate}%):`, totalsX, yPos);
  doc.text(`${data.taxAmount.toFixed(2)} EUR`, totalsValueX, yPos, { align: 'right' });

  yPos += 2;
  doc.setLineWidth(0.5);
  doc.setDrawColor(40, 40, 40);
  doc.line(totalsX, yPos + 2, marginRight, yPos + 2);

  yPos += 8;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 80, 0);
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(`${data.total.toFixed(2)} EUR`, totalsValueX, yPos, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // ── NOTAS ─────────────────────────────────────────────────────
  if (data.notes) {
    yPos += 14;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(normalizeText(`Notas: ${data.notes}`), marginLeft, yPos);
    doc.setTextColor(0, 0, 0);
  }

  // ── PIE DE PÁGINA ─────────────────────────────────────────────
  const footerY = 285;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginLeft, footerY - 6, marginRight, footerY - 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(140, 140, 140);
  doc.text(
    normalizeText(`${restaurantName} | ${restaurantNif} | ${restaurantAddress}`),
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
