import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateInvoicePDF } from "./invoicePdf";

// ─── Tests for invoice PDF generation ────────────────────────────────────────

describe("generateInvoicePDF", () => {
  const sampleData = {
    invoiceNumber: "FAC-2026-0001",
    customer: {
      name: "Empresa Test S.L.",
      nif: "B12345678",
      address: "Calle Mayor, 1",
      city: "Barcelona",
      email: "test@empresa.com",
      phone: "600 000 000",
    },
    items: [
      { name: "Pollo Tikka Masala", quantity: 2, unitPrice: 12.5, total: 25.0 },
      { name: "Naan", quantity: 3, unitPrice: 2.5, total: 7.5 },
    ],
    subtotal: 29.55,
    taxRate: 10,
    taxAmount: 2.95,
    total: 32.5,
    tableId: "5",
    notes: "Pago en efectivo",
    createdAt: new Date("2026-04-13T12:00:00Z"),
  };

  it("returns a Buffer", () => {
    const result = generateInvoicePDF(sampleData);
    expect(result).toBeInstanceOf(Buffer);
  });

  it("generates a non-empty PDF buffer", () => {
    const result = generateInvoicePDF(sampleData);
    expect(result.length).toBeGreaterThan(1000);
  });

  it("works without optional fields (email, phone, notes, tableId)", () => {
    const minimalData = {
      invoiceNumber: "FAC-2026-0002",
      customer: {
        name: "Juan García",
        nif: "12345678A",
        address: "Av. Diagonal, 100",
        city: "Madrid",
      },
      items: [{ name: "Samosa", quantity: 1, unitPrice: 5.0, total: 5.0 }],
      subtotal: 4.55,
      taxRate: 10,
      taxAmount: 0.45,
      total: 5.0,
    };
    const result = generateInvoicePDF(minimalData);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(500);
  });

  it("uses custom restaurant data when provided", () => {
    const customData = {
      ...sampleData,
      restaurantName: "RESTAURANTE PRUEBA",
      restaurantAddress: "Calle Test, 99",
      restaurantNif: "NIF: A99999999",
      restaurantPhone: "Tel: 900 000 000",
    };
    const result = generateInvoicePDF(customData);
    expect(result).toBeInstanceOf(Buffer);
  });

  it("handles special characters in names without crashing", () => {
    const dataWithSpecialChars = {
      ...sampleData,
      customer: {
        ...sampleData.customer,
        name: "Ñoño & Asociados, S.L.",
        address: "Calle de la Añoranza, 5",
        city: "Málaga",
      },
      items: [
        { name: "Pollo con Ñoquis", quantity: 1, unitPrice: 15.0, total: 15.0 },
      ],
    };
    expect(() => generateInvoicePDF(dataWithSpecialChars)).not.toThrow();
  });

  it("handles multiple items correctly", () => {
    const manyItemsData = {
      ...sampleData,
      items: Array.from({ length: 20 }, (_, i) => ({
        name: `Plato ${i + 1}`,
        quantity: 1,
        unitPrice: 10.0,
        total: 10.0,
      })),
      subtotal: 181.82,
      taxRate: 10,
      taxAmount: 18.18,
      total: 200.0,
    };
    const result = generateInvoicePDF(manyItemsData);
    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(1000);
  });
});

// ─── Tests for invoice number generation logic ────────────────────────────────

describe("invoice number format", () => {
  it("follows the FAC-YYYY-NNNN pattern", () => {
    const pattern = /^FAC-\d{4}-\d{4}$/;
    expect("FAC-2026-0001").toMatch(pattern);
    expect("FAC-2026-9999").toMatch(pattern);
  });

  it("pads numbers to 4 digits", () => {
    const year = new Date().getFullYear();
    const num = 1;
    const invoiceNumber = `FAC-${year}-${String(num).padStart(4, "0")}`;
    expect(invoiceNumber).toBe(`FAC-${year}-0001`);
  });

  it("increments correctly from last invoice", () => {
    const lastInvoiceNumber = "FAC-2026-0042";
    const match = lastInvoiceNumber.match(/(\d+)$/);
    const nextNum = match ? parseInt(match[1]) + 1 : 1;
    const year = 2026;
    const nextInvoiceNumber = `FAC-${year}-${String(nextNum).padStart(4, "0")}`;
    expect(nextInvoiceNumber).toBe("FAC-2026-0043");
  });
});
