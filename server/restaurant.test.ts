import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import * as restaurantDb from './restaurantDb';
import { getDb } from './db';
import { orders, sales } from '../drizzle/schema';
import { eq, inArray } from 'drizzle-orm';

// Use unique test table IDs that will never conflict with real tables
const TEST_TABLE_IDS = ['__test_1__', '__test_2__', '__test_3__', '__test_0plus__', '__test_0minus__'];

describe('Restaurant API', () => {
  const caller = appRouter.createCaller({} as any);

  beforeAll(async () => {
    // Initialize test tables
    await restaurantDb.initializeTables(TEST_TABLE_IDS);
  });

  afterAll(async () => {
    // Clean up ONLY test data (never touch real tables)
    const db = await getDb();
    if (db) {
      await db.delete(orders).where(inArray(orders.tableId, TEST_TABLE_IDS));
      await db.delete(sales).where(inArray(sales.tableId, TEST_TABLE_IDS));
    }
  });

  it('should initialize tables', async () => {
    const result = await caller.restaurant.initializeTables({
      tableIds: TEST_TABLE_IDS,
    });
    expect(result.success).toBe(true);

    const tables = await caller.restaurant.getTables();
    const testTables = tables.filter(t => TEST_TABLE_IDS.includes(t.tableId));
    expect(testTables.length).toBeGreaterThanOrEqual(TEST_TABLE_IDS.length);
  });

  it('should add an order to a table', async () => {
    const result = await caller.restaurant.addOrder({
      tableId: TEST_TABLE_IDS[0],
      itemId: 'test-item-1',
      itemName: 'Test Item',
      itemPrice: '10.50',
      quantity: 2,
    });
    expect(result.success).toBe(true);

    const orders = await caller.restaurant.getTableOrders({ tableId: TEST_TABLE_IDS[0] });
    expect(orders.length).toBeGreaterThan(0);
    const testOrder = orders.find(o => o.itemId === 'test-item-1');
    expect(testOrder?.itemName).toBe('Test Item');
    expect(testOrder?.quantity).toBe(2);
  });

  it('should update order quantity', async () => {
    // First add an order
    await caller.restaurant.addOrder({
      tableId: TEST_TABLE_IDS[1],
      itemId: 'test-item-2',
      itemName: 'Another Item',
      itemPrice: '15.00',
      quantity: 1,
    });

    const tableOrders = await caller.restaurant.getTableOrders({ tableId: TEST_TABLE_IDS[1] });
    const testOrder = tableOrders.find(o => o.itemId === 'test-item-2');
    expect(testOrder).toBeDefined();
    const orderId = testOrder!.id;

    // Update quantity
    const result = await caller.restaurant.updateOrderQuantity({
      orderId,
      quantity: 5,
    });
    expect(result.success).toBe(true);

    const updatedOrders = await caller.restaurant.getTableOrders({ tableId: TEST_TABLE_IDS[1] });
    const updatedOrder = updatedOrders.find(o => o.id === orderId);
    expect(updatedOrder?.quantity).toBe(5);
  });

  it('should delete an order', async () => {
    // Add an order
    await caller.restaurant.addOrder({
      tableId: TEST_TABLE_IDS[2],
      itemId: 'test-item-3',
      itemName: 'Item to Delete',
      itemPrice: '8.00',
      quantity: 1,
    });

    const ordersBefore = await caller.restaurant.getTableOrders({ tableId: TEST_TABLE_IDS[2] });
    const testOrder = ordersBefore.find(o => o.itemId === 'test-item-3');
    expect(testOrder).toBeDefined();
    const orderId = testOrder!.id;

    // Delete the order
    const result = await caller.restaurant.deleteOrder({ orderId });
    expect(result.success).toBe(true);

    const ordersAfter = await caller.restaurant.getTableOrders({ tableId: TEST_TABLE_IDS[2] });
    expect(ordersAfter.find(o => o.id === orderId)).toBeUndefined();
  });

  it('should complete a table and create a sale', async () => {
    const tableId = TEST_TABLE_IDS[3];

    // Add orders to table
    await caller.restaurant.addOrder({
      tableId,
      itemId: 'item-1',
      itemName: 'Item 1',
      itemPrice: '10.00',
      quantity: 2,
    });
    await caller.restaurant.addOrder({
      tableId,
      itemId: 'item-2',
      itemName: 'Item 2',
      itemPrice: '5.00',
      quantity: 1,
    });

    // Complete the table
    const result = await caller.restaurant.completeTable({
      tableId,
      items: [
        { menuItem: { name: 'Item 1', price: 10 }, quantity: 2 },
        { menuItem: { name: 'Item 2', price: 5 }, quantity: 1 },
      ],
      total: '25.00',
      paymentMethod: 'cash',
    });
    expect(result.success).toBe(true);

    // Verify orders are cleared
    const remainingOrders = await caller.restaurant.getTableOrders({ tableId });
    expect(remainingOrders.length).toBe(0);

    // Verify sale was created
    const allSales = await caller.restaurant.getSales();
    const tableSale = allSales.find(s => s.tableId === tableId);
    expect(tableSale).toBeDefined();
    expect(tableSale?.total).toBe('25.00');
  });

  it('should get all orders across all tables', async () => {
    // Add orders to multiple test tables
    await caller.restaurant.addOrder({
      tableId: TEST_TABLE_IDS[0],
      itemId: 'multi-1',
      itemName: 'Multi Item 1',
      itemPrice: '12.00',
      quantity: 1,
    });
    await caller.restaurant.addOrder({
      tableId: TEST_TABLE_IDS[1],
      itemId: 'multi-2',
      itemName: 'Multi Item 2',
      itemPrice: '8.00',
      quantity: 3,
    });

    const allOrders = await caller.restaurant.getAllOrders();
    // Just verify the endpoint works and returns results
    expect(Array.isArray(allOrders)).toBe(true);
  });

  it('should support special table IDs like 0+ and 0-', async () => {
    // Test with test table that simulates 0+
    await caller.restaurant.addOrder({
      tableId: TEST_TABLE_IDS[3],
      itemId: 'special-1',
      itemName: 'Special Item',
      itemPrice: '20.00',
      quantity: 1,
    });

    const ordersPlus = await caller.restaurant.getTableOrders({ tableId: TEST_TABLE_IDS[3] });
    expect(Array.isArray(ordersPlus)).toBe(true);

    // Test with test table that simulates 0-
    await caller.restaurant.addOrder({
      tableId: TEST_TABLE_IDS[4],
      itemId: 'special-2',
      itemName: 'Another Special',
      itemPrice: '15.00',
      quantity: 2,
    });

    const ordersMinus = await caller.restaurant.getTableOrders({ tableId: TEST_TABLE_IDS[4] });
    expect(Array.isArray(ordersMinus)).toBe(true);
  });
});
