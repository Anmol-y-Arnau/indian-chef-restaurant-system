import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { addOrder, updateOrderDeliveryStatus } from './restaurantDb';
import { getDb } from './db';
import { orders } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Use a unique test table ID that will never conflict with real tables
const TEST_TABLE_ID = '__test_delivered__';

describe('Delivered Status', () => {
  let testOrderId: number;

  beforeAll(async () => {
    // Clean up any leftover test data first
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.tableId, TEST_TABLE_ID));
    }

    // Create a test order in the isolated test table
    await addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'test-delivered-item',
      itemName: 'Test Delivered Item',
      itemPrice: '10.00',
      quantity: 1,
      isDelivered: 0,
    });

    // Get the ID of the created order
    const db2 = await getDb();
    if (db2) {
      const testOrders = await db2.select().from(orders).where(eq(orders.tableId, TEST_TABLE_ID));
      testOrderId = testOrders[testOrders.length - 1].id;
    }
  });

  afterAll(async () => {
    // Clean up ONLY test data
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.tableId, TEST_TABLE_ID));
    }
  });

  it('should mark order as delivered', async () => {
    await updateOrderDeliveryStatus(testOrderId, true);

    const db = await getDb();
    const testOrders = db ? await db.select().from(orders).where(eq(orders.tableId, TEST_TABLE_ID)) : [];
    const order = testOrders.find(o => o.id === testOrderId);

    expect(order).toBeDefined();
    expect(order?.isDelivered).toBe(1); // tinyint 1 = true
  });

  it('should toggle order back to pending', async () => {
    await updateOrderDeliveryStatus(testOrderId, false);

    const db = await getDb();
    const testOrders = db ? await db.select().from(orders).where(eq(orders.tableId, TEST_TABLE_ID)) : [];
    const order = testOrders.find(o => o.id === testOrderId);

    expect(order).toBeDefined();
    expect(order?.isDelivered).toBe(0); // tinyint 0 = false
  });

  it('should handle multiple toggles', async () => {
    await updateOrderDeliveryStatus(testOrderId, true);
    await updateOrderDeliveryStatus(testOrderId, false);
    await updateOrderDeliveryStatus(testOrderId, true);

    const db = await getDb();
    const testOrders = db ? await db.select().from(orders).where(eq(orders.tableId, TEST_TABLE_ID)) : [];
    const order = testOrders.find(o => o.id === testOrderId);

    expect(order?.isDelivered).toBe(1);
  });
});
