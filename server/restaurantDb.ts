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
  
  // Filter by itemId and find a pending (not delivered) order with EXACT same attributes
  const sameItemOrders = existingOrders.filter(o => o.itemId === order.itemId);
  
  // CRITICAL: Only group if spiceLevel AND notes are EXACTLY the same
  // Normalize null/undefined to null for comparison
  const normalizeValue = (val: string | null | undefined) => val || null;
  
  const pendingOrder = sameItemOrders.find((o: any) => 
    o.isDelivered === 0 && 
    normalizeValue(o.spiceLevel) === normalizeValue(order.spiceLevel) &&
    normalizeValue(o.notes) === normalizeValue(order.notes)
  );
  
  if (pendingOrder) {
    // Update the quantity of the existing pending order with EXACT same attributes
    await db.update(orders)
      .set({ 
        quantity: pendingOrder.quantity + (order.quantity || 1),
        updatedAt: new Date() 
      })
      .where(eq(orders.id, pendingOrder.id));
    console.log(`[addOrder] Updated pending order ${pendingOrder.id} with new quantity: ${pendingOrder.quantity + (order.quantity || 1)} (spiceLevel: ${order.spiceLevel}, notes: ${order.notes})`);
  } else {
    // No matching pending order found, create a new one
    await db.insert(orders).values(order);
    console.log(`[addOrder] Created new order for item ${order.itemId} on table ${order.tableId} (spiceLevel: ${order.spiceLevel}, notes: ${order.notes})`);
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
  
  // Ensure serviceDate is set (should be provided by caller)
  if (!sale.serviceDate) {
    console.warn('[addSale] serviceDate not provided, using current time');
    sale.serviceDate = new Date();
  }
  
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

export async function deleteSale(saleId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(sales).where(eq(sales.id, saleId));
}
