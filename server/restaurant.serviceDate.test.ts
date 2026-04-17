import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as restaurantDb from './restaurantDb';
import { getDb } from './db';
import { orders, sales } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Use a unique test table ID that will never conflict with real tables
const TEST_TABLE_ID = '__test_servicedate__';

describe('Restaurant Service Date', () => {
  beforeAll(async () => {
    // Initialize test table
    await restaurantDb.initializeTables([TEST_TABLE_ID]);
  });

  afterAll(async () => {
    // Clean up ONLY test data
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.tableId, TEST_TABLE_ID));
      await db.delete(sales).where(eq(sales.tableId, TEST_TABLE_ID));
    }
  });

  it('should use first order timestamp as serviceDate when completing table', async () => {
    // Clean up any leftover test data first
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.tableId, TEST_TABLE_ID));
      await db.delete(sales).where(eq(sales.tableId, TEST_TABLE_ID));
    }

    // Simulate: Order at 22:00 on Day 1
    const day1_22h = new Date('2026-01-25T22:00:00Z');

    // Add first order
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'samosa',
      itemName: 'Samosa',
      itemPrice: '5.90',
      quantity: 2,
      createdAt: day1_22h, // Override createdAt for testing
    });

    // Wait a bit to simulate time passing
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate: Second order at 23:30 on Day 1
    const day1_23h30 = new Date('2026-01-25T23:30:00Z');
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'curry',
      itemName: 'Chicken Curry',
      itemPrice: '12.90',
      quantity: 1,
      createdAt: day1_23h30,
    });

    // Get orders to find the oldest one
    const tableOrders = await restaurantDb.getOrdersByTable(TEST_TABLE_ID);
    expect(tableOrders.length).toBeGreaterThan(0);

    // Find oldest order
    const oldestOrder = tableOrders.reduce((oldest, order) => {
      if (!oldest || new Date(order.createdAt) < new Date(oldest.createdAt)) {
        return order;
      }
      return oldest;
    }, tableOrders[0]);

    const serviceDate = new Date(oldestOrder.createdAt);

    // Complete table (simulate payment at 01:00 on Day 2)
    await restaurantDb.addSale({
      tableId: TEST_TABLE_ID,
      items: tableOrders.map(o => ({
        id: o.id,
        menuItem: {
          id: o.itemId,
          name: o.itemName,
          price: parseFloat(o.itemPrice),
          category: 'starters' as const,
          description: '',
        },
        quantity: o.quantity,
      })),
      total: '18.80',
      paymentMethod: 'cash',
      serviceDate, // Should be 22:00 on Day 1
    });

    // Verify: Sale should have serviceDate = first order time (Day 1)
    const allSales = await restaurantDb.getAllSales();
    const testSale = allSales.find(s => s.tableId === TEST_TABLE_ID);

    expect(testSale).toBeDefined();
    expect(testSale!.serviceDate).toBeDefined();

    // serviceDate should match the first order time (22:00 Day 1)
    const serviceDateStr = new Date(testSale!.serviceDate).toISOString();
    const expectedDateStr = day1_22h.toISOString();

    expect(serviceDateStr).toBe(expectedDateStr);

    // Cleanup after test
    if (db) {
      await db.delete(orders).where(eq(orders.tableId, TEST_TABLE_ID));
      await db.delete(sales).where(eq(sales.tableId, TEST_TABLE_ID));
    }
  });
});
