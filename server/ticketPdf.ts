import { jsPDF } from 'jspdf';
import type { Order } from '../shared/types';

interface TicketData {
  tableId: string;
  orders: Array<Order & { menuItem: { name: string; price: number } }>;
  total: number;
  date: Date;
  ticketNumber: number;
}

export function generateTicketPDF(data: TicketData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configuración de fuente
  doc.setFont('helvetica');

  // Logo y encabezado
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INDIAN CHEF', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RESTAURANT', 105, 27, { align: 'center' });

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);

  // Datos de la empresa
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('AJIT & RANJIT, S.L.', 105, 40, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('NIF: B24897415', 105, 46, { align: 'center' });
  doc.text('C/ Lasauca, 18 Bs', 105, 51, { align: 'center' });
  doc.text('17600 Figueres (Girona)', 105, 56, { align: 'center' });

  // Línea separadora
  doc.line(20, 62, 190, 62);

  // Información del ticket
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Ticket Nº: ${data.ticketNumber}`, 20, 70);
  doc.text(`Mesa: ${data.tableId}`, 20, 76);
  
  const dateStr = data.date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Fecha: ${dateStr}`, 20, 82);

  // Línea separadora
  doc.line(20, 88, 190, 88);

  // Encabezados de tabla
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Cant.', 20, 94);
  doc.text('Producto', 40, 94);
  doc.text('Precio', 170, 94, { align: 'right' });

  // Línea debajo de encabezados
  doc.setLineWidth(0.3);
  doc.line(20, 96, 190, 96);

  // Items del pedido
  doc.setFont('helvetica', 'normal');
  let yPos = 102;
  
  for (const order of data.orders) {
    // Cantidad
    doc.text(`${order.quantity}x`, 20, yPos);
    
    // Nombre del producto
    doc.text(order.menuItem.name, 40, yPos);
    
    // Precio
    const itemTotal = order.quantity * order.menuItem.price;
    doc.text(`${itemTotal.toFixed(2)}€`, 170, yPos, { align: 'right' });
    
    yPos += 6;
    
    // Personalización (picante y notas)
    if (order.spiceLevel || order.notes) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      if (order.spiceLevel && order.spiceLevel !== 'none') {
        const spiceLabels: Record<string, string> = {
          'mild': '(Picante: -)',
          'medium': '(Picante: +-)',
          'hot': '(Picante: +)',
          'extra_hot': '(Picante: ++)'
        };
        doc.text(spiceLabels[order.spiceLevel] || '', 40, yPos);
        yPos += 4;
      }
      
      if (order.notes) {
        doc.text(`Nota: ${order.notes}`, 40, yPos);
        yPos += 4;
      }
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
    }
    
    // Espacio entre items
    yPos += 2;
    
    // Nueva página si es necesario
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
  }

  // Línea antes del total
  yPos += 4;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);

  // Total
  yPos += 8;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 120, yPos);
  doc.text(`${data.total.toFixed(2)}€`, 170, yPos, { align: 'right' });

  // Mensaje de agradecimiento
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('¡Gracias por su visita!', 105, yPos, { align: 'center' });

  // Generar buffer del PDF
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
