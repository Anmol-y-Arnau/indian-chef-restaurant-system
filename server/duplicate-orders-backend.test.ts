import { describe, it, expect, beforeEach } from 'vitest';
import * as restaurantDb from './restaurantDb';

describe('Backend: Duplicate Orders Logic', () => {
  const testTableId = 'test-table-999';
  const testItemId = '83'; // Agua Grande

  beforeEach(async () => {
    // Clean up test data
    await restaurantDb.clearTableOrders(testTableId);
  });

  it('should create a new order when no existing orders', async () => {
    // Add first order
    await restaurantDb.addOrder({
      tableId: testTableId,
      itemId: testItemId,
      itemName: 'Agua Grande',
      itemPrice: '4.00',
      quantity: 1,
    });

    const orders = await restaurantDb.getOrdersByTable(testTableId);
    expect(orders.length).toBe(1);
    expect(orders[0].quantity).toBe(1);
    expect(orders[0].isDelivered).toBe(0);
  });

  it('should update pending order quantity when adding same item', async () => {
    // Add first order
    await restaurantDb.addOrder({
      tableId: testTableId,
      itemId: testItemId,
      itemName: 'Agua Grande',
      itemPrice: '4.00',
      quantity: 1,
    });

    // Add same item again (should update quantity)
    await restaurantDb.addOrder({
      tableId: testTableId,
      itemId: testItemId,
      itemName: 'Agua Grande',
      itemPrice: '4.00',
      quantity: 1,
    });

    const orders = await restaurantDb.getOrdersByTable(testTableId);
    expect(orders.length).toBe(1); // Still only 1 order
    expect(orders[0].quantity).toBe(2); // Quantity updated to 2
    expect(orders[0].isDelivered).toBe(0);
  });

  it('should create new order when existing order is delivered', async () => {
    // Add first order
    await restaurantDb.addOrder({
      tableId: testTableId,
      itemId: testItemId,
      itemName: 'Agua Grande',
      itemPrice: '4.00',
      quantity: 4,
    });

    let orders = await restaurantDb.getOrdersByTable(testTableId);
    const firstOrderId = orders[0].id;

    // Mark as delivered
    await restaurantDb.updateOrderDeliveryStatus(firstOrderId, true);

    // Add same item again (should create new order)
    await restaurantDb.addOrder({
      tableId: testTableId,
      itemId: testItemId,
      itemName: 'Agua Grande',
      itemPrice: '4.00',
      quantity: 1,
    });

    orders = await restaurantDb.getOrdersByTable(testTableId);
    expect(orders.length).toBe(2); // Now 2 separate orders
    
    const deliveredOrder = orders.find(o => o.id === firstOrderId);
    const newOrder = orders.find(o => o.id !== firstOrderId);
    
    expect(deliveredOrder?.quantity).toBe(4);
    expect(deliveredOrder?.isDelivered).toBe(1);
    expect(newOrder?.quantity).toBe(1);
    expect(newOrder?.isDelivered).toBe(0);
  });

  it('should handle multiple delivered orders correctly', async () => {
    // Add first order
    await restaurantDb.addOrder({
      tableId: testTableId,
      itemId: testItemId,
      itemName: 'Agua Grande',
      itemPrice: '4.00',
      quantity: 2,
    });

    let orders = await restaurantDb.getOrdersByTable(testTableId);
    const firstOrderId = orders[0].id;

    // Mark as delivered
    await restaurantDb.updateOrderDeliveryStatus(firstOrderId, true);

    // Add second order
    await restaurantDb.addOrder({
      tableId: testTableId,
      itemId: testItemId,
      itemName: 'Agua Grande',
      itemPrice: '4.00',
      quantity: 1,
    });

    orders = await restaurantDb.getOrdersByTable(testTableId);
    const secondOrderId = orders.find(o => o.id !== firstOrderId)?.id;

    // Mark second as delivered
    if (secondOrderId) {
      await restaurantDb.updateOrderDeliveryStatus(secondOrderId, true);
    }

    // Add third order (should create new one since all are delivered)
    await restaurantDb.addOrder({
      tableId: testTableId,
      itemId: testItemId,
      itemName: 'Agua Grande',
      itemPrice: '4.00',
      quantity: 1,
    });

    orders = await restaurantDb.getOrdersByTable(testTableId);
    expect(orders.length).toBe(3); // 3 separate orders
    
    const pendingOrders = orders.filter(o => o.isDelivered === 0);
    expect(pendingOrders.length).toBe(1); // Only 1 pending
    expect(pendingOrders[0].quantity).toBe(1);
  });
});
