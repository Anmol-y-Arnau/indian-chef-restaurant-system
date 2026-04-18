import { and, eq, gte, lte, desc, asc } from "drizzle-orm";
import { reservations, type InsertReservation } from "../drizzle/schema";
import { getDb } from "./db";

// ========== RESERVATIONS ==========

export async function getAllReservations() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reservations).orderBy(asc(reservations.date), asc(reservations.time));
}

export async function getReservationsByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(reservations)
    .where(eq(reservations.date, date))
    .orderBy(asc(reservations.time));
}

export async function getReservationsByDateRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(reservations)
    .where(and(gte(reservations.date, startDate), lte(reservations.date, endDate)))
    .orderBy(asc(reservations.date), asc(reservations.time));
}

export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(reservations).where(eq(reservations.id, id)).limit(1);
  return result[0] || null;
}

export async function createReservation(data: InsertReservation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reservations).values(data);
  const id = (result as any)[0]?.insertId ?? (result as any).insertId;
  return await getReservationById(Number(id));
}

export async function updateReservation(
  id: number,
  data: Partial<Omit<InsertReservation, "id" | "createdAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reservations).set(data).where(eq(reservations.id, id));
  return await getReservationById(id);
}

export async function updateReservationStatus(
  id: number,
  status: "pending" | "confirmed" | "seated" | "cancelled" | "no_show"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reservations).set({ status }).where(eq(reservations.id, id));
  return await getReservationById(id);
}

export async function deleteReservation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reservations).where(eq(reservations.id, id));
}

export async function getUpcomingReservations(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split("T")[0];
  return await db
    .select()
    .from(reservations)
    .where(
      and(
        gte(reservations.date, today),
        eq(reservations.status, "confirmed")
      )
    )
    .orderBy(asc(reservations.date), asc(reservations.time))
    .limit(limit);
}
