import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import * as restaurantDb from './restaurantDb';

describe('Restaurant API', () => {
  const caller = appRouter.createCaller({} as any);

  beforeAll(async () => {
    // Initialize test tables
    await restaurantDb.initializeTables(['1', '2', '0+', '0-']);
  });

  afterAll(async () => {
    // Clean up test data
    const tables = await restaurantDb.getAllTables();
    for (const table of tables) {
      await restaurantDb.clearTableOrders(table.tableId);
    }
  });

  it('should initialize tables', async () => {
    const result = await caller.restaurant.initializeTables({
      tableIds: ['1', '2', '3', '0+', '0-'],
    });
    expect(result.success).toBe(true);

    const tables = await caller.restaurant.getTables();
    expect(tables.length).toBeGreaterThanOrEqual(5);
  });

  it('should add an order to a table', async () => {
    const result = await caller.restaurant.addOrder({
      tableId: '1',
      itemId: 'test-item-1',
      itemName: 'Test Item',
      itemPrice: '10.50',
      quantity: 2,
    });
    expect(result.success).toBe(true);

    const orders = await caller.restaurant.getTableOrders({ tableId: '1' });
    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].itemName).toBe('Test Item');
    expect(orders[0].quantity).toBe(2);
  });

  it('should update order quantity', async () => {
    // First add an order
    await caller.restaurant.addOrder({
      tableId: '2',
      itemId: 'test-item-2',
      itemName: 'Another Item',
      itemPrice: '15.00',
      quantity: 1,
    });

    const orders = await caller.restaurant.getTableOrders({ tableId: '2' });
    const orderId = orders[0].id;

    // Update quantity
    const result = await caller.restaurant.updateOrderQuantity({
      orderId,
      quantity: 5,
    });
    expect(result.success).toBe(true);

    const updatedOrders = await caller.restaurant.getTableOrders({ tableId: '2' });
    expect(updatedOrders[0].quantity).toBe(5);
  });

  it('should delete an order', async () => {
    // Add an order
    await caller.restaurant.addOrder({
      tableId: '3',
      itemId: 'test-item-3',
      itemName: 'Item to Delete',
      itemPrice: '8.00',
      quantity: 1,
    });

    const ordersBefore = await caller.restaurant.getTableOrders({ tableId: '3' });
    expect(ordersBefore.length).toBeGreaterThan(0);

    const orderId = ordersBefore[0].id;

    // Delete the order
    const result = await caller.restaurant.deleteOrder({ orderId });
    expect(result.success).toBe(true);

    const ordersAfter = await caller.restaurant.getTableOrders({ tableId: '3' });
    expect(ordersAfter.length).toBe(ordersBefore.length - 1);
  });

  it('should complete a table and create a sale', async () => {
    // Add orders to table
    await caller.restaurant.addOrder({
      tableId: '0+',
      itemId: 'item-1',
      itemName: 'Item 1',
      itemPrice: '10.00',
      quantity: 2,
    });
    await caller.restaurant.addOrder({
      tableId: '0+',
      itemId: 'item-2',
      itemName: 'Item 2',
      itemPrice: '5.00',
      quantity: 1,
    });

    // Complete the table
    const result = await caller.restaurant.completeTable({
      tableId: '0+',
      items: [
        { menuItem: { name: 'Item 1', price: 10 }, quantity: 2 },
        { menuItem: { name: 'Item 2', price: 5 }, quantity: 1 },
      ],
      total: '25.00',
      paymentMethod: 'cash',
    });
    expect(result.success).toBe(true);

    // Verify orders are cleared
    const orders = await caller.restaurant.getTableOrders({ tableId: '0+' });
    expect(orders.length).toBe(0);

    // Verify sale was created
    const sales = await caller.restaurant.getSales();
    const tableSale = sales.find(s => s.tableId === '0+');
    expect(tableSale).toBeDefined();
    expect(tableSale?.total).toBe('25.00');
  });

  it('should get all orders across all tables', async () => {
    // Add orders to multiple tables
    await caller.restaurant.addOrder({
      tableId: '1',
      itemId: 'multi-1',
      itemName: 'Multi Item 1',
      itemPrice: '12.00',
      quantity: 1,
    });
    await caller.restaurant.addOrder({
      tableId: '2',
      itemId: 'multi-2',
      itemName: 'Multi Item 2',
      itemPrice: '8.00',
      quantity: 3,
    });

    const allOrders = await caller.restaurant.getAllOrders();
    expect(allOrders.length).toBeGreaterThanOrEqual(2);
  });

  it('should support special table IDs like 0+ and 0-', async () => {
    // Test 0+ table
    await caller.restaurant.addOrder({
      tableId: '0+',
      itemId: 'special-1',
      itemName: 'Special Item',
      itemPrice: '20.00',
      quantity: 1,
    });

    const ordersPlus = await caller.restaurant.getTableOrders({ tableId: '0+' });
    expect(ordersPlus.length).toBeGreaterThan(0);

    // Test 0- table
    await caller.restaurant.addOrder({
      tableId: '0-',
      itemId: 'special-2',
      itemName: 'Another Special',
      itemPrice: '15.00',
      quantity: 2,
    });

    const ordersMinus = await caller.restaurant.getTableOrders({ tableId: '0-' });
    expect(ordersMinus.length).toBeGreaterThan(0);
  });
});
