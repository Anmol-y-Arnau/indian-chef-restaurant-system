import { eq, desc } from "drizzle-orm";
import { restaurantTables, orders, sales, type InsertOrder, type InsertSale, type InsertRestaurantTable } from "../drizzle/schema";
import { getDb } from "./db";

// ========== TABLES ==========

export async function getAllTables() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(restaurantTables);
}

export async function upsertTable(tableId: string, status: "free" | "occupied" | "reserved") {
  const db = await getDb();
  if (!db) return;

  await db.insert(restaurantTables)
    .values({ tableId, status })
    .onDuplicateKeyUpdate({ set: { status, updatedAt: new Date() } });
}

export async function initializeTables(tableIds: string[]) {
  const db = await getDb();
  if (!db) return;

  for (const tableId of tableIds) {
    await db.insert(restaurantTables)
      .values({ tableId, status: "free" })
      .onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
  }
}

// ========== ORDERS ==========

export async function getOrdersByTable(tableId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.tableId, tableId));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders);
}

export async function addOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) return;
  
  // Check if there's an existing order for the same item on the same table
  const existingOrders = await db.select().from(orders)
    .where(eq(orders.tableId, order.tableId));
  
  // Filter by itemId and find a pending (not delivered) order
  const sameItemOrders = existingOrders.filter(o => o.itemId === order.itemId);
  const pendingOrder = sameItemOrders.find((o: any) => o.isDelivered === 0);
  
  if (pendingOrder) {
    // Update the quantity of the existing pending order
    await db.update(orders)
      .set({ 
        quantity: pendingOrder.quantity + (order.quantity || 1),
        updatedAt: new Date() 
      })
      .where(eq(orders.id, pendingOrder.id));
    console.log(`[addOrder] Updated pending order ${pendingOrder.id} with new quantity: ${pendingOrder.quantity + (order.quantity || 1)}`);
  } else {
    // No pending order found, create a new one
    await db.insert(orders).values(order);
    console.log(`[addOrder] Created new order for item ${order.itemId} on table ${order.tableId}`);
  }
}

export async function updateOrderQuantity(orderId: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ quantity, updatedAt: new Date() }).where(eq(orders.id, orderId));
}

export async function updateOrderDeliveryStatus(orderId: number, isDelivered: boolean) {
  const db = await getDb();
  if (!db) {
    console.error('[updateOrderDeliveryStatus] No database connection');
    return;
  }
  console.log(`[updateOrderDeliveryStatus] Updating order ${orderId} to isDelivered=${isDelivered ? 1 : 0}`);
  const result = await db.update(orders).set({ isDelivered: isDelivered ? 1 : 0, updatedAt: new Date() }).where(eq(orders.id, orderId));
  console.log('[updateOrderDeliveryStatus] Update result:', result);
}

export async function deleteOrder(orderId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(orders).where(eq(orders.id, orderId));
}

export async function clearTableOrders(tableId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(orders).where(eq(orders.tableId, tableId));
}

// ========== SALES ==========

export async function addSale(sale: InsertSale) {
  const db = await getDb();
  if (!db) return;
  await db.insert(sales).values(sale);
}

export async function getAllSales() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(sales).orderBy(desc(sales.createdAt));
}

export async function getSalesByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  // Note: This is a simplified query. Adjust based on your needs.
  return await db.select().from(sales);
}

export async function updateSalePaymentMethod(saleId: number, paymentData: { paymentMethod: string; splitBetween?: number; cashPayers?: number; cardPayers?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(sales)
    .set({ 
      paymentMethod: paymentData.paymentMethod,
      splitBetween: paymentData.splitBetween,
      cashPayers: paymentData.cashPayers,
      cardPayers: paymentData.cardPayers
    })
    .where(eq(sales.id, saleId));
}
