import { describe, it, expect, beforeAll } from 'vitest';
import { addOrder, getAllOrders, updateOrderDeliveryStatusBatch } from './restaurantDb';

describe('Batch Delivery Status', () => {
  let testOrderIds: number[] = [];

  beforeAll(async () => {
    // Crear 3 pedidos de prueba en la misma mesa
    for (let i = 0; i < 3; i++) {
      await addOrder({
        tableId: '99',
        itemId: `batch-test-${i}-${Date.now()}`,
        itemName: `Batch Test Item ${i}`,
        itemPrice: '10.00',
        quantity: 1,
      });
    }
    
    // Obtener los IDs de los pedidos creados
    const orders = await getAllOrders();
    const batchOrders = orders.filter(o => o.tableId === '99' && o.itemName.startsWith('Batch Test'));
    testOrderIds = batchOrders.map(o => o.id);
  });

  it('should mark multiple orders as delivered in one batch call', async () => {
    expect(testOrderIds.length).toBeGreaterThanOrEqual(3);
    
    // Marcar todos como entregados en una sola llamada
    await updateOrderDeliveryStatusBatch(testOrderIds, true);
    
    // Verificar que TODOS se actualizaron
    const orders = await getAllOrders();
    for (const id of testOrderIds) {
      const order = orders.find(o => o.id === id);
      expect(order).toBeDefined();
      expect(order?.isDelivered).toBe(1);
    }
  });

  it('should batch toggle all back to pending', async () => {
    // Volver todos a pendiente en una sola llamada
    await updateOrderDeliveryStatusBatch(testOrderIds, false);
    
    // Verificar que TODOS se actualizaron
    const orders = await getAllOrders();
    for (const id of testOrderIds) {
      const order = orders.find(o => o.id === id);
      expect(order).toBeDefined();
      expect(order?.isDelivered).toBe(0);
    }
  });

  it('should handle empty array gracefully', async () => {
    // No debería fallar con un array vacío
    await updateOrderDeliveryStatusBatch([], true);
    // Si llegamos aquí sin error, el test pasa
    expect(true).toBe(true);
  });

  it('should handle single item batch', async () => {
    // Batch con un solo item debería funcionar igual
    const singleId = [testOrderIds[0]];
    await updateOrderDeliveryStatusBatch(singleId, true);
    
    const orders = await getAllOrders();
    const order = orders.find(o => o.id === testOrderIds[0]);
    expect(order?.isDelivered).toBe(1);
    
    // Los otros deberían seguir en pending
    const otherOrder = orders.find(o => o.id === testOrderIds[1]);
    expect(otherOrder?.isDelivered).toBe(0);
  });
});
