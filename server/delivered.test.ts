import { describe, it, expect, beforeAll } from 'vitest';
import { addOrder, getAllOrders, updateOrderDeliveryStatus } from './restaurantDb';

describe('Delivered Status', () => {
  let testOrderId: number;

  beforeAll(async () => {
    // Crear un pedido de prueba
    const testOrder = {
      tableId: '1',
      itemId: 1,
      itemName: 'Test Item',
      itemPrice: 10.00,
      quantity: 1,
      isDelivered: 0
    };
    await addOrder(testOrder);
    
    // Obtener el ID del pedido creado
    const orders = await getAllOrders();
    const lastOrder = orders[orders.length - 1];
    testOrderId = lastOrder.id;
  });

  it('should mark order as delivered', async () => {
    // Marcar como entregado
    await updateOrderDeliveryStatus(testOrderId, true);
    
    // Verificar que se actualizó
    const orders = await getAllOrders();
    const order = orders.find(o => o.id === testOrderId);
    
    expect(order).toBeDefined();
    expect(order?.isDelivered).toBe(1); // tinyint 1 = true
  });

  it('should toggle order back to pending', async () => {
    // Volver a pendiente
    await updateOrderDeliveryStatus(testOrderId, false);
    
    // Verificar que se actualizó
    const orders = await getAllOrders();
    const order = orders.find(o => o.id === testOrderId);
    
    expect(order).toBeDefined();
    expect(order?.isDelivered).toBe(0); // tinyint 0 = false
  });

  it('should handle multiple toggles', async () => {
    // Toggle múltiples veces
    await updateOrderDeliveryStatus(testOrderId, true);
    await updateOrderDeliveryStatus(testOrderId, false);
    await updateOrderDeliveryStatus(testOrderId, true);
    
    // Verificar estado final
    const orders = await getAllOrders();
    const order = orders.find(o => o.id === testOrderId);
    
    expect(order?.isDelivered).toBe(1);
  });
});
