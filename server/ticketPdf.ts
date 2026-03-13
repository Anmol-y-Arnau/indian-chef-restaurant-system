import { jsPDF } from 'jspdf';
import type { Order } from '../shared/types';

interface TicketData {
  tableId: string;
  orders: Array<Order & { menuItem: { name: string; price: number } }>;
  total: number;
  date: Date;
  ticketNumber: number;
}

/**
 * Normaliza caracteres especiales que jsPDF/Helvetica no soporta bien.
 * Convierte ñ, tildes y otros caracteres latinos a sus equivalentes ASCII
 * o a versiones compatibles con la fuente estándar.
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

/**
 * Agrupa los pedidos por nombre de plato + notas + picante,
 * sumando cantidades y recalculando el precio total.
 * Esto evita que el mismo plato aparezca en líneas separadas.
 */
function groupOrders(orders: Array<Order & { menuItem: { name: string; price: number } }>) {
  const grouped = new Map<string, {
    name: string;
    quantity: number;
    unitPrice: number;
    spiceLevel?: string | null;
    notes?: string | null;
  }>();

  for (const order of orders) {
    // La clave incluye nombre + notas + picante para que variantes distintas no se mezclen
    const key = `${order.menuItem.name}||${order.spiceLevel || ''}||${order.notes || ''}`;
    
    if (grouped.has(key)) {
      const existing = grouped.get(key)!;
      existing.quantity += order.quantity;
    } else {
      grouped.set(key, {
        name: order.menuItem.name,
        quantity: order.quantity,
        unitPrice: order.menuItem.price,
        spiceLevel: order.spiceLevel,
        notes: order.notes,
      });
    }
  }

  return Array.from(grouped.values());
}

/**
 * Divide un texto largo en múltiples líneas que caben en el ancho dado.
 * Usa la medida real del texto de jsPDF para mayor precisión.
 */
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
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [text];
}

export function generateTicketPDF(data: TicketData): Buffer {
  // Formato de tiquet estrecho (80mm ≈ ancho A7 horizontal, usamos A4 para compatibilidad)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Márgenes y ancho útil
  const marginLeft = 20;
  const marginRight = 190;
  const contentWidth = marginRight - marginLeft; // 170mm
  const productColWidth = 110; // ancho máximo para nombre de producto
  const priceColX = marginRight; // columna de precio alineada a la derecha

  doc.setFont('helvetica');

  // ── ENCABEZADO ──────────────────────────────────────────────
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INDIAN CHEF', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RESTAURANT', 105, 27, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(marginLeft, 32, marginRight, 32);

  // ── DATOS EMPRESA ────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('AJIT & RANJIT, S.L.', 105, 40, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('NIF: B24897415', 105, 46, { align: 'center' });
  doc.text('C/ Lasauca, 18 Bs', 105, 51, { align: 'center' });
  doc.text('17600 Figueres (Girona)', 105, 56, { align: 'center' });

  doc.line(marginLeft, 62, marginRight, 62);

  // ── INFO TICKET ───────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ticket No: ${data.ticketNumber}`, marginLeft, 70);
  doc.text(normalizeText(`Mesa: ${data.tableId}`), marginLeft, 76);
  
  const dateStr = data.date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha: ${dateStr}`, marginLeft, 82);

  doc.line(marginLeft, 88, marginRight, 88);

  // ── CABECERA TABLA ────────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Cant.', marginLeft, 94);
  doc.text('Producto', marginLeft + 18, 94);
  doc.text('Precio', priceColX, 94, { align: 'right' });

  doc.setLineWidth(0.3);
  doc.line(marginLeft, 96, marginRight, 96);

  // ── ITEMS (agrupados) ─────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  let yPos = 102;

  // Agrupar pedidos para evitar duplicados separados
  const groupedItems = groupOrders(data.orders);

  for (const item of groupedItems) {
    const itemTotal = item.quantity * item.unitPrice;
    const normalizedName = normalizeText(item.name);
    const priceText = `${itemTotal.toFixed(2)}EUR`;

    // Calcular líneas necesarias para el nombre
    doc.setFontSize(9);
    const nameLines = wrapText(doc, normalizedName, productColWidth);

    // Cantidad (primera línea)
    doc.text(`${item.quantity}x`, marginLeft, yPos);
    
    // Nombre (con wrap si es necesario)
    for (let i = 0; i < nameLines.length; i++) {
      doc.text(nameLines[i], marginLeft + 18, yPos + i * 5);
    }
    
    // Precio alineado a la derecha (primera línea)
    doc.text(priceText, priceColX, yPos, { align: 'right' });

    yPos += nameLines.length * 5;

    // Personalización: picante
    if (item.spiceLevel && item.spiceLevel !== 'none') {
      doc.setFontSize(8);
      doc.setTextColor(120, 80, 0);
      const spiceLabels: Record<string, string> = {
        'mild': '(Picante: -)',
        'medium': '(Picante: +-)',
        'hot': '(Picante: +)',
        'extra_hot': '(Picante: ++)'
      };
      doc.text(spiceLabels[item.spiceLevel] || '', marginLeft + 18, yPos);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      yPos += 4;
    }
    
    // Notas
    if (item.notes) {
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const noteLines = wrapText(doc, normalizeText(`Nota: ${item.notes}`), productColWidth);
      for (const noteLine of noteLines) {
        doc.text(noteLine, marginLeft + 18, yPos);
        yPos += 4;
      }
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
    }

    // Espacio entre items
    yPos += 3;

    // Nueva página si es necesario
    if (yPos > 265) {
      doc.addPage();
      yPos = 20;
    }
  }

  // ── TOTAL ─────────────────────────────────────────────────────
  yPos += 4;
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, marginRight, yPos);

  yPos += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 120, yPos);
  doc.text(`${data.total.toFixed(2)}EUR`, priceColX, yPos, { align: 'right' });

  // ── PIE ───────────────────────────────────────────────────────
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(normalizeText('¡Gracias por su visita!'), 105, yPos, { align: 'center' });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
