import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, tinyint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Restaurant tables (mesas)
 */
export const restaurantTables = mysqlTable("restaurant_tables", {
  id: int("id").autoincrement().primaryKey(),
  tableId: varchar("tableId", { length: 20 }).notNull().unique(), // "1", "2", "0+", "0-", etc.
  status: mysqlEnum("status", ["free", "occupied", "reserved"]).default("free").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RestaurantTable = typeof restaurantTables.$inferSelect;
export type InsertRestaurantTable = typeof restaurantTables.$inferInsert;

/**
 * Orders (pedidos activos en cada mesa)
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  tableId: varchar("tableId", { length: 20 }).notNull(), // Reference to restaurantTables.tableId
  itemId: varchar("itemId", { length: 50 }).notNull(), // Menu item ID
  itemName: text("itemName").notNull(),
  itemPrice: decimal("itemPrice", { precision: 10, scale: 2 }).notNull(),
  quantity: int("quantity").notNull().default(1),
  isDelivered: tinyint("isDelivered").notNull().default(0), // 0 = pendiente, 1 = entregado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Sales history (historial de ventas completadas)
 */
export const sales = mysqlTable("sales", {
  id: int("id").autoincrement().primaryKey(),
  tableId: varchar("tableId", { length: 20 }).notNull(),
  items: json("items").notNull(), // Array of order items
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // "cash", "card", "mixed"
  splitBetween: int("splitBetween").default(1), // Number of people splitting the bill
  cashPayers: int("cashPayers").default(0), // Number of people paying cash (for mixed payments)
  cardPayers: int("cardPayers").default(0), // Number of people paying card (for mixed payments)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;
