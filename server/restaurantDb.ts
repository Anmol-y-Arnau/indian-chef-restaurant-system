import { eq, desc, inArray } from "drizzle-orm";
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

export async function getActiveOrders() {
  // Returns only orders from currently OCCUPIED tables (filters out orphaned/old orders)
  const db = await getDb();
  if (!db) return [];

  const occupiedTables = await db
    .select({ tableId: restaurantTables.tableId })
    .from(restaurantTables)
    .where(eq(restaurantTables.status, 'occupied'));

  if (occupiedTables.length === 0) return [];

  const occupiedTableIds = occupiedTables.map(t => t.tableId);
  return await db.select().from(orders).where(inArray(orders.tableId, occupiedTableIds));
}

export async function cleanOrphanedOrders() {
  // Deletes orders from tables that are NOT occupied (orphaned orders from old sessions)
  const db = await getDb();
  if (!db) return 0;

  const occupiedTables = await db
    .select({ tableId: restaurantTables.tableId })
    .from(restaurantTables)
    .where(eq(restaurantTables.status, 'occupied'));

  const allOrders = await db.select({ id: orders.id, tableId: orders.tableId }).from(orders);

  if (allOrders.length === 0) return 0;

  const occupiedTableIds = new Set(occupiedTables.map(t => t.tableId));
  const orphanedIds = allOrders
    .filter(o => !occupiedTableIds.has(o.tableId))
    .map(o => o.id);

  if (orphanedIds.length === 0) return 0;

  await db.delete(orders).where(inArray(orders.id, orphanedIds));
  console.log(`[cleanOrphanedOrders] Deleted ${orphanedIds.length} orphaned orders`);
  return orphanedIds.length;
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

export async function updateOrderDeliveryStatusBatch(orderIds: number[], isDelivered: boolean) {
  const db = await getDb();
  if (!db) {
    console.error('[updateOrderDeliveryStatusBatch] No database connection');
    return;
  }
  if (orderIds.length === 0) return;
  console.log(`[updateOrderDeliveryStatusBatch] Updating ${orderIds.length} orders to isDelivered=${isDelivered ? 1 : 0}`);
  // Use inArray for batch update in a single query
  const { inArray } = await import('drizzle-orm');
  await db.update(orders).set({ isDelivered: isDelivered ? 1 : 0, updatedAt: new Date() }).where(inArray(orders.id, orderIds));
  console.log('[updateOrderDeliveryStatusBatch] Batch update complete');
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

// ========== FREQUENT CUSTOMERS ==========

export async function getAllFrequentCustomers() {
  const db = await getDb();
  if (!db) return [];
  const { frequentCustomers } = await import("../drizzle/schema");
  return await db.select().from(frequentCustomers).orderBy(frequentCustomers.name);
}

export async function getFrequentCustomerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const { frequentCustomers } = await import("../drizzle/schema");
  const result = await db.select().from(frequentCustomers).where(eq(frequentCustomers.id, id));
  return result[0] || null;
}

export async function addFrequentCustomer(customer: { name: string; nif: string; address: string; city: string; email?: string; phone?: string }) {
  const db = await getDb();
  if (!db) return null;
  const { frequentCustomers } = await import("../drizzle/schema");
  await db.insert(frequentCustomers).values(customer);
  // Return the newly created customer
  const result = await db.select().from(frequentCustomers).where(eq(frequentCustomers.nif, customer.nif)).orderBy(frequentCustomers.createdAt).limit(1);
  return result[0] || null;
}

export async function updateFrequentCustomer(id: number, customer: { name: string; nif: string; address: string; city: string; email?: string; phone?: string }) {
  const db = await getDb();
  if (!db) return;
  const { frequentCustomers } = await import("../drizzle/schema");
  await db.update(frequentCustomers)
    .set({ ...customer, updatedAt: new Date() })
    .where(eq(frequentCustomers.id, id));
}

export async function deleteFrequentCustomer(id: number) {
  const db = await getDb();
  if (!db) return;
  const { frequentCustomers } = await import("../drizzle/schema");
  await db.delete(frequentCustomers).where(eq(frequentCustomers.id, id));
}

// ========== INVOICES ==========

export async function getNextInvoiceNumber(): Promise<string> {
  const db = await getDb();
  if (!db) return 'FAC-2026-0001';
  const { invoices } = await import("../drizzle/schema");
  const year = new Date().getFullYear();
  const result = await db.select().from(invoices)
    .orderBy(desc(invoices.id))
    .limit(1);
  if (result.length === 0) return `FAC-${year}-0001`;
  // Extract the numeric part from the last invoice number
  const lastNum = result[0].invoiceNumber;
  const match = lastNum.match(/(\d+)$/);
  const nextNum = match ? parseInt(match[1]) + 1 : 1;
  return `FAC-${year}-${String(nextNum).padStart(4, '0')}`;
}

export async function createInvoice(invoice: {
  customerId: number;
  customerSnapshot: object;
  items: object;
  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  tableId?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const { invoices } = await import("../drizzle/schema");
  const invoiceNumber = await getNextInvoiceNumber();
  await db.insert(invoices).values({ ...invoice, invoiceNumber });
  const result = await db.select().from(invoices)
    .where(eq(invoices.invoiceNumber, invoiceNumber))
    .limit(1);
  return result[0] || null;
}

export async function getInvoicesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  const { invoices } = await import("../drizzle/schema");
  return await db.select().from(invoices)
    .where(eq(invoices.customerId, customerId))
    .orderBy(desc(invoices.createdAt));
}

export async function getAllInvoices() {
  const db = await getDb();
  if (!db) return [];
  const { invoices } = await import("../drizzle/schema");
  return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
}

export async function getInvoiceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const { invoices } = await import("../drizzle/schema");
  const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return result[0] || null;
}
