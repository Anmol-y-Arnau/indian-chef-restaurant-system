import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, tinyint, boolean } from "drizzle-orm/mysql-core";

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
  spiceLevel: varchar("spiceLevel", { length: 10 }), // "-", "+-", "+", "++"
  notes: text("notes"), // Observaciones adicionales
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
  serviceDate: timestamp("serviceDate").notNull(), // Fecha del primer pedido (para cierres correctos)
  createdAt: timestamp("createdAt").defaultNow().notNull(), // Fecha de cobro
});

export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;

/**
 * Frequent customers (clientes frecuentes para facturación)
 */
export const frequentCustomers = mysqlTable("frequent_customers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nif: varchar("nif", { length: 20 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FrequentCustomer = typeof frequentCustomers.$inferSelect;
export type InsertFrequentCustomer = typeof frequentCustomers.$inferInsert;

/**
 * Invoices (facturas generadas)
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoiceNumber", { length: 30 }).notNull().unique(), // e.g. "FAC-2026-0001"
  customerId: int("customerId").notNull(), // Reference to frequentCustomers.id
  customerSnapshot: json("customerSnapshot").notNull(), // Snapshot of customer data at invoice time
  items: json("items").notNull(), // Array of { name, quantity, unitPrice, total }
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("taxRate", { precision: 5, scale: 2 }).notNull().default("10.00"), // IVA %
  taxAmount: decimal("taxAmount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  tableId: varchar("tableId", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Custom item suggestions (platos personalizados frecuentes para sugerir añadir al menú)
 * Cada vez que se añade un plato 'Varios', se registra aquí.
 * Cuando un nombre aparece 3+ veces, se sugiere añadirlo al menú fijo.
 */
export const customItemLog = mysqlTable("custom_item_log", {
  id: int("id").autoincrement().primaryKey(),
  itemName: varchar("itemName", { length: 255 }).notNull(), // Nombre normalizado (lowercase, trimmed)
  originalName: varchar("originalName", { length: 255 }).notNull(), // Nombre original tal como se escribió
  count: int("count").notNull().default(1), // Cuántas veces se ha pedido
  addedToMenu: tinyint("addedToMenu").notNull().default(0), // 0 = no añadido, 1 = ya está en el menú
  lastSeenAt: timestamp("lastSeenAt").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomItemLog = typeof customItemLog.$inferSelect;
export type InsertCustomItemLog = typeof customItemLog.$inferInsert;

/**
 * Reservations (reservas de mesa)
 * Puede recibir reservas desde la web externa vía API pública o crearse manualmente.
 */
export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  // Datos del cliente
  guestName: varchar("guestName", { length: 255 }).notNull(),
  guestPhone: varchar("guestPhone", { length: 30 }).notNull(),
  guestEmail: varchar("guestEmail", { length: 320 }),
  // Datos de la reserva
  date: varchar("date", { length: 10 }).notNull(),         // "YYYY-MM-DD"
  time: varchar("time", { length: 5 }).notNull(),          // "HH:MM"
  partySize: int("partySize").notNull().default(2),        // Número de comensales
  tableId: varchar("tableId", { length: 20 }),             // Mesa asignada (opcional)
  // Estado
  status: mysqlEnum("status", ["pending", "confirmed", "seated", "cancelled", "no_show", "finished"])
    .default("pending").notNull(),
  // Asignación de mesas (puede ser más de una cuando se juntan)
  assignedTableIds: text("assignedTableIds"),              // JSON array: ["0+","0-"]
  assignmentInstruction: text("assignmentInstruction"),   // Texto para el camarero
  estimatedEnd: varchar("estimatedEnd", { length: 5 }),   // "HH:MM" hora estimada de salida
  isPeakDay: tinyint("isPeakDay").default(0).notNull(), // Día punta (1h30 máx)
  // Información adicional
  notes: text("notes"),                                    // Notas del cliente o del restaurante
  origin: mysqlEnum("origin", ["manual", "web", "phone"])
    .default("manual").notNull(),                          // Dónde se originó la reserva
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;

/**
 * Walk-ins: clientes sin reserva que se sientan directamente
 * Se registran para bloquear mesas en tiempo real
 */
export const walkIns = mysqlTable("walk_ins", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull(),         // "YYYY-MM-DD"
  time: varchar("time", { length: 5 }).notNull(),          // "HH:MM" hora de llegada
  partySize: int("partySize").notNull().default(2),
  assignedTableIds: text("assignedTableIds").notNull(),    // JSON array: ["2"]
  assignmentInstruction: text("assignmentInstruction"),
  estimatedEnd: varchar("estimatedEnd", { length: 5 }),    // "HH:MM" hora estimada de salida
  isPeakDay: tinyint("isPeakDay").default(0).notNull(),
  status: mysqlEnum("walkin_status", ["seated", "finished", "cancelled"])
    .default("seated").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WalkIn = typeof walkIns.$inferSelect;
export type InsertWalkIn = typeof walkIns.$inferInsert;

/**
 * Peak days: días marcados como punta (límite de 1h30 por mesa)
 */
export const peakDays = mysqlTable("peak_days", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(), // "YYYY-MM-DD"
  reason: varchar("reason", { length: 255 }),              // "San Valentín", "Puente", etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PeakDay = typeof peakDays.$inferSelect;
export type InsertPeakDay = typeof peakDays.$inferInsert;
