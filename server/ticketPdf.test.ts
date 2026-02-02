import { describe, it, expect } from 'vitest';
import { generateTicketPDF } from './ticketPdf';

describe('Ticket PDF Generation', () => {
  it('should generate PDF with ticket number', () => {
    const testData = {
      tableId: 'Mesa 4',
      orders: [
        {
          id: 1,
          tableId: '4',
          itemId: 'murg_butter',
          itemName: 'Murg Butter',
          itemPrice: '11.90',
          quantity: 1,
          isDelivered: 0,
          spiceLevel: '+',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          menuItem: {
            name: 'Murg Butter',
            price: 11.90,
          },
        },
        {
          id: 2,
          tableId: '4',
          itemId: 'cheese_naan',
          itemName: 'Cheese Naan',
          itemPrice: '4.90',
          quantity: 2,
          isDelivered: 0,
          spiceLevel: null,
          notes: 'Extra queso',
          createdAt: new Date(),
          updatedAt: new Date(),
          menuItem: {
            name: 'Cheese Naan',
            price: 4.90,
          },
        },
      ],
      total: 21.70,
      date: new Date('2026-02-02T22:01:07'),
      ticketNumber: 42,
    };

    const pdfBuffer = generateTicketPDF(testData);

    // Verify PDF was generated
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Verify it's a valid PDF (starts with %PDF)
    const pdfHeader = pdfBuffer.toString('utf-8', 0, 4);
    expect(pdfHeader).toBe('%PDF');
  });

  it('should handle orders with spice levels', () => {
    const testData = {
      tableId: 'Mesa 1',
      orders: [
        {
          id: 1,
          tableId: '1',
          itemId: 'test',
          itemName: 'Test Curry',
          itemPrice: '10.00',
          quantity: 1,
          isDelivered: 0,
          spiceLevel: 'extra_hot',
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          menuItem: {
            name: 'Test Curry',
            price: 10.00,
          },
        },
      ],
      total: 10.00,
      date: new Date(),
      ticketNumber: 1,
    };

    const pdfBuffer = generateTicketPDF(testData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle orders with notes', () => {
    const testData = {
      tableId: 'TAKEAWAY',
      orders: [
        {
          id: 1,
          tableId: 'TAKEAWAY',
          itemId: 'test',
          itemName: 'Test Item',
          itemPrice: '5.00',
          quantity: 3,
          isDelivered: 0,
          spiceLevel: null,
          notes: 'Sin cebolla, extra salsa',
          createdAt: new Date(),
          updatedAt: new Date(),
          menuItem: {
            name: 'Test Item',
            price: 5.00,
          },
        },
      ],
      total: 15.00,
      date: new Date(),
      ticketNumber: 99,
    };

    const pdfBuffer = generateTicketPDF(testData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should handle multiple items with different quantities', () => {
    const testData = {
      tableId: 'Mesa 10',
      orders: [
        {
          id: 1,
          tableId: '10',
          itemId: 'item1',
          itemName: 'Item 1',
          itemPrice: '8.50',
          quantity: 2,
          isDelivered: 0,
          spiceLevel: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          menuItem: { name: 'Item 1', price: 8.50 },
        },
        {
          id: 2,
          tableId: '10',
          itemId: 'item2',
          itemName: 'Item 2',
          itemPrice: '12.00',
          quantity: 1,
          isDelivered: 0,
          spiceLevel: 'medium',
          notes: 'Con arroz',
          createdAt: new Date(),
          updatedAt: new Date(),
          menuItem: { name: 'Item 2', price: 12.00 },
        },
        {
          id: 3,
          tableId: '10',
          itemId: 'item3',
          itemName: 'Item 3',
          itemPrice: '3.50',
          quantity: 4,
          isDelivered: 0,
          spiceLevel: null,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          menuItem: { name: 'Item 3', price: 3.50 },
        },
      ],
      total: 43.00,
      date: new Date(),
      ticketNumber: 123,
    };

    const pdfBuffer = generateTicketPDF(testData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
