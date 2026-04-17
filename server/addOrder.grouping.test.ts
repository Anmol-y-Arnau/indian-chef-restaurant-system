import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as restaurantDb from './restaurantDb';
import { getDb } from './db';
import { orders } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// Use a unique test table ID that will never conflict with real tables
const TEST_TABLE_ID = '__test_grouping__';

describe('addOrder Grouping Logic', () => {
  beforeEach(async () => {
    // Only clear orders for the test table, NOT the entire orders table
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.tableId, TEST_TABLE_ID));
    }
  });

  afterAll(async () => {
    // Final cleanup of test table orders
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(eq(orders.tableId, TEST_TABLE_ID));
    }
  });

  it('should group orders with same itemId, spiceLevel, and notes', async () => {
    // Add first order: Lamb Curry, picante
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'lamb-curry',
      itemName: 'Lamb Curry',
      itemPrice: '12.50',
      quantity: 1,
      spiceLevel: '+',
      notes: null,
      isDelivered: 0,
    });

    // Add second order: same item, same spiceLevel, same notes
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'lamb-curry',
      itemName: 'Lamb Curry',
      itemPrice: '12.50',
      quantity: 1,
      spiceLevel: '+',
      notes: null,
      isDelivered: 0,
    });

    const db = await getDb();
    const testOrders = db ? await db.select().from(orders).where(eq(orders.tableId, TEST_TABLE_ID)) : [];

    // Should have only 1 order with quantity 2
    expect(testOrders.length).toBe(1);
    expect(testOrders[0].quantity).toBe(2);
    expect(testOrders[0].spiceLevel).toBe('+');
  });

  it('should NOT group orders with different spiceLevel', async () => {
    // Add first order: Lamb Curry, picante
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'lamb-curry',
      itemName: 'Lamb Curry',
      itemPrice: '12.50',
      quantity: 1,
      spiceLevel: '+',
      notes: null,
      isDelivered: 0,
    });

    // Add second order: same item, different spiceLevel
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'lamb-curry',
      itemName: 'Lamb Curry',
      itemPrice: '12.50',
      quantity: 2,
      spiceLevel: '-',
      notes: null,
      isDelivered: 0,
    });

    const db = await getDb();
    const testOrders = db ? await db.select().from(orders).where(eq(orders.tableId, TEST_TABLE_ID)) : [];

    // Should have 2 separate orders
    expect(testOrders.length).toBe(2);

    const picanteOrder = testOrders.find(o => o.spiceLevel === '+');
    const noPicanteOrder = testOrders.find(o => o.spiceLevel === '-');

    expect(picanteOrder?.quantity).toBe(1);
    expect(noPicanteOrder?.quantity).toBe(2);
  });

  it('should NOT group orders with different notes', async () => {
    // Add first order: Refresco with "Coca Cola Zero"
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'refresco',
      itemName: 'Refresco',
      itemPrice: '2.50',
      quantity: 1,
      spiceLevel: null,
      notes: 'Coca Cola Zero',
      isDelivered: 0,
    });

    // Add second order: same item, different notes
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'refresco',
      itemName: 'Refresco',
      itemPrice: '2.50',
      quantity: 1,
      spiceLevel: null,
      notes: 'Fanta Naranja',
      isDelivered: 0,
    });

    // Add third order: same item, no notes
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'refresco',
      itemName: 'Refresco',
      itemPrice: '2.50',
      quantity: 1,
      spiceLevel: null,
      notes: null,
      isDelivered: 0,
    });

    const db = await getDb();
    const testOrders = db ? await db.select().from(orders).where(eq(orders.tableId, TEST_TABLE_ID)) : [];

    // Should have 3 separate orders
    expect(testOrders.length).toBe(3);

    const cocaColaOrder = testOrders.find(o => o.notes === 'Coca Cola Zero');
    const fantaOrder = testOrders.find(o => o.notes === 'Fanta Naranja');
    const noNotesOrder = testOrders.find(o => o.notes === null);

    expect(cocaColaOrder?.quantity).toBe(1);
    expect(fantaOrder?.quantity).toBe(1);
    expect(noNotesOrder?.quantity).toBe(1);
  });

  it('should group orders with both spiceLevel and notes matching', async () => {
    // Add first order: Lamb Curry, picante, with note
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'lamb-curry',
      itemName: 'Lamb Curry',
      itemPrice: '12.50',
      quantity: 1,
      spiceLevel: '+',
      notes: 'Sin cebolla',
      isDelivered: 0,
    });

    // Add second order: exact same attributes
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'lamb-curry',
      itemName: 'Lamb Curry',
      itemPrice: '12.50',
      quantity: 1,
      spiceLevel: '+',
      notes: 'Sin cebolla',
      isDelivered: 0,
    });

    const db = await getDb();
    const testOrders = db ? await db.select().from(orders).where(eq(orders.tableId, TEST_TABLE_ID)) : [];

    // Should have only 1 order with quantity 2
    expect(testOrders.length).toBe(1);
    expect(testOrders[0].quantity).toBe(2);
    expect(testOrders[0].spiceLevel).toBe('+');
    expect(testOrders[0].notes).toBe('Sin cebolla');
  });

  it('should NOT group delivered orders', async () => {
    // Add first order and mark as delivered
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'lamb-curry',
      itemName: 'Lamb Curry',
      itemPrice: '12.50',
      quantity: 1,
      spiceLevel: '+',
      notes: null,
      isDelivered: 1, // Already delivered
    });

    // Add second order: same attributes but pending
    await restaurantDb.addOrder({
      tableId: TEST_TABLE_ID,
      itemId: 'lamb-curry',
      itemName: 'Lamb Curry',
      itemPrice: '12.50',
      quantity: 1,
      spiceLevel: '+',
      notes: null,
      isDelivered: 0,
    });

    const db = await getDb();
    const testOrders = db ? await db.select().from(orders).where(eq(orders.tableId, TEST_TABLE_ID)) : [];

    // Should have 2 separate orders (don't group delivered with pending)
    expect(testOrders.length).toBe(2);

    const deliveredOrder = testOrders.find(o => o.isDelivered === 1);
    const pendingOrder = testOrders.find(o => o.isDelivered === 0);

    expect(deliveredOrder?.quantity).toBe(1);
    expect(pendingOrder?.quantity).toBe(1);
  });
});
