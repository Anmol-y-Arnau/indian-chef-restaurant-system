import { jsPDF } from "jspdf";
import fs from "fs";

// Datos de la empresa
const companyData = {
  name: "AJIT & RANJIT, S.L.",
  nif: "B24897415",
  address: "C/ Lasauca 18 Bs",
  city: "Figueres",
};

// Datos del cliente
const clientData = {
  name: "STAR PROP PATRIMONIAL, S.L.",
  nif: "B05380993",
  address: "C/ CASTELLAR, 6, 17491",
  city: "LLANÇA (GIRONA)",
};

// Pedido
const orderDate = "21/2/2026";
const items = [
  { name: "Royal king para dos personas", quantity: 1, price: 15.90 },
  { name: "Murg Tandoori", quantity: 1, price: 11.90 },
  { name: "Refresco", quantity: 1, price: 3.50 },
  { name: "Copa de Vino", quantity: 2, price: 3.50 }, // 7.00€ total = 2 copas a 3.50€
];

const total = 38.30;

// Generar número de factura (formato: YYYYMM-XXX)
const invoiceNumber = "202602-001"; // Ajustar según sea necesario

// Crear PDF
const doc = new jsPDF();

// Configurar fuente
doc.setFont("helvetica");

// HEADER - Empresa
doc.setFontSize(16);
doc.setFont("helvetica", "bold");
doc.text(companyData.name, 20, 20);
doc.setFontSize(10);
doc.setFont("helvetica", "normal");
doc.text(`NIF: ${companyData.nif}`, 20, 27);
doc.text(companyData.address, 20, 32);
doc.text(companyData.city, 20, 37);

// FACTURA título
doc.setFontSize(20);
doc.setFont("helvetica", "bold");
doc.text("FACTURA", 150, 20);
doc.setFontSize(10);
doc.setFont("helvetica", "normal");
doc.text(`Nº ${invoiceNumber}`, 150, 27);
doc.text(`Fecha: ${orderDate}`, 150, 32);

// Línea separadora
doc.setLineWidth(0.5);
doc.line(20, 45, 190, 45);

// DATOS DEL CLIENTE
doc.setFontSize(12);
doc.setFont("helvetica", "bold");
doc.text("CLIENTE:", 20, 55);
doc.setFontSize(10);
doc.setFont("helvetica", "normal");
doc.text(clientData.name, 20, 62);
doc.text(`NIF: ${clientData.nif}`, 20, 67);
doc.text(clientData.address, 20, 72);
doc.text(clientData.city, 20, 77);

// Línea separadora
doc.line(20, 85, 190, 85);

// TABLA DE ITEMS
doc.setFontSize(10);
doc.setFont("helvetica", "bold");
doc.text("DESCRIPCIÓN", 20, 95);
doc.text("CANT.", 130, 95);
doc.text("PRECIO", 155, 95);
doc.text("TOTAL", 180, 95);

doc.line(20, 97, 190, 97);

// Items
doc.setFont("helvetica", "normal");
let yPos = 105;
items.forEach((item) => {
  const itemTotal = item.quantity * item.price;
  doc.text(item.name, 20, yPos);
  doc.text(item.quantity.toString(), 135, yPos);
  doc.text(`${item.price.toFixed(2)}€`, 155, yPos);
  doc.text(`${itemTotal.toFixed(2)}€`, 180, yPos);
  yPos += 7;
});

// Línea antes del total
yPos += 5;
doc.line(20, yPos, 190, yPos);

// TOTAL
yPos += 10;
doc.setFont("helvetica", "bold");
doc.setFontSize(12);
doc.text("TOTAL:", 155, yPos);
doc.text(`${total.toFixed(2)}€`, 180, yPos);

// IVA incluido
yPos += 7;
doc.setFontSize(8);
doc.setFont("helvetica", "italic");
doc.text("(IVA 10% incluido)", 155, yPos);

// Pie de página
doc.setFontSize(8);
doc.setFont("helvetica", "normal");
doc.text("Gracias por su visita", 105, 280, { align: "center" });

// Guardar PDF
const outputPath = "/home/ubuntu/indian_chef_system/FACTURA_STARPROP_20260221.pdf";
doc.save(outputPath);

console.log(`✅ Factura generada: ${outputPath}`);
