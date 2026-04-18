/**
 * Walk-in and Peak Day database helpers
 */
import { eq, and, gte, lte, like } from "drizzle-orm";
import { getDb } from "./db";
import { walkIns, peakDays, type WalkIn, type InsertWalkIn, type PeakDay } from "../drizzle/schema";
import { assignTable, estimateEndTime, getOccupiedTableIds, type OccupiedSlot } from "./tableAssignment";

// ─── Walk-ins ─────────────────────────────────────────────────────────────────

export async function createWalkIn(data: {
  date: string;
  time: string;
  partySize: number;
  tableIds: string[];
  instruction?: string;
  estimatedEnd?: string;
  isPeakDay?: boolean;
  notes?: string;
}): Promise<WalkIn | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(walkIns).values({
    date: data.date,
    time: data.time,
    partySize: data.partySize,
    assignedTableIds: JSON.stringify(data.tableIds),
    assignmentInstruction: data.instruction ?? null,
    estimatedEnd: data.estimatedEnd ?? null,
    isPeakDay: data.isPeakDay ? 1 : 0,
    status: "seated",
    notes: data.notes ?? null,
  });
  const id = (result as any).insertId;
  const [row] = await db.select().from(walkIns).where(eq(walkIns.id, id));
  return row ?? null;
}

export async function getWalkInsByDate(date: string): Promise<WalkIn[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(walkIns).where(eq(walkIns.date, date));
}

export async function getActiveWalkIns(date: string): Promise<WalkIn[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(walkIns).where(
    and(eq(walkIns.date, date), eq(walkIns.status, "seated"))
  );
}

export async function finishWalkIn(id: number): Promise<WalkIn | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(walkIns).set({ status: "finished" }).where(eq(walkIns.id, id));
  const [row] = await db.select().from(walkIns).where(eq(walkIns.id, id));
  return row ?? null;
}

export async function cancelWalkIn(id: number): Promise<WalkIn | null> {
  const db = await getDb();
  if (!db) return null;
  await db.update(walkIns).set({ status: "cancelled" }).where(eq(walkIns.id, id));
  const [row] = await db.select().from(walkIns).where(eq(walkIns.id, id));
  return row ?? null;
}

export async function deleteTestWalkIns(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(walkIns).where(like(walkIns.notes, "__test__%"));
}

// ─── Peak days ────────────────────────────────────────────────────────────────

export async function isPeakDay(date: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db.select().from(peakDays).where(eq(peakDays.date, date));
  return !!row;
}

export async function setPeakDay(date: string, reason?: string): Promise<PeakDay | null> {
  const db = await getDb();
  if (!db) return null;
  // Upsert: insert or ignore if already exists
  await db.insert(peakDays).values({ date, reason: reason ?? null }).onDuplicateKeyUpdate({ set: { reason: reason ?? null } });
  const [row] = await db.select().from(peakDays).where(eq(peakDays.date, date));
  return row ?? null;
}

export async function removePeakDay(date: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(peakDays).where(eq(peakDays.date, date));
}

export async function getPeakDaysByRange(from: string, to: string): Promise<PeakDay[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(peakDays).where(and(gte(peakDays.date, from), lte(peakDays.date, to)));
}

// ─── Capacity snapshot ────────────────────────────────────────────────────────

/**
 * Build the list of OccupiedSlots for a given date from both reservations and walk-ins.
 * Used by the assignment engine.
 */
export async function buildOccupiedSlots(date: string): Promise<OccupiedSlot[]> {
  const db = await getDb();
  if (!db) return [];

  // Import here to avoid circular deps
  const { reservations } = await import("../drizzle/schema");
  const { eq: eqFn, not, inArray } = await import("drizzle-orm");

  // Active reservations (not cancelled/no_show)
  const activeReservations = await db.select().from(reservations).where(
    and(
      eqFn(reservations.date, date),
      not(inArray(reservations.status, ["cancelled", "no_show"]))
    )
  );

  // Active walk-ins
  const activeWalkIns = await getActiveWalkIns(date);

  const slots: OccupiedSlot[] = [];

  for (const r of activeReservations) {
    const tableIds: string[] = r.assignedTableIds ? JSON.parse(r.assignedTableIds) : (r.tableId ? [r.tableId] : []);
    if (tableIds.length === 0) continue;
    slots.push({
      tableIds,
      partySize: r.partySize,
      date: r.date,
      time: r.time,
      estimatedEnd: r.estimatedEnd ?? null,
      type: "reservation",
      reservationId: r.id,
    });
  }

  for (const w of activeWalkIns) {
    const tableIds: string[] = JSON.parse(w.assignedTableIds);
    slots.push({
      tableIds,
      partySize: w.partySize,
      date: w.date,
      time: w.time,
      estimatedEnd: w.estimatedEnd ?? null,
      type: "walkin",
    });
  }

  return slots;
}

/**
 * Parse a natural language walk-in text like "mesa 2 3 personas"
 * Returns { tableId, partySize } or null if can't parse.
 */
export function parseWalkInText(text: string): { tableId: string; partySize: number } | null {
  const normalized = text.toLowerCase().trim();

  // Patterns: "mesa 0+ 2 personas", "mesa 2 3 personas", "terraza 4 personas"
  const mesaMatch = normalized.match(/mesa\s+([\w+\-]+)\s+(\d+)/);
  const terrazaMatch = normalized.match(/terraza\s+(\d+)/);

  if (mesaMatch) {
    const tableId = mesaMatch[1].toUpperCase().replace("0PLUS", "0+").replace("0MINUS", "0-");
    const partySize = parseInt(mesaMatch[2], 10);
    if (!isNaN(partySize) && partySize > 0) return { tableId, partySize };
  }

  if (terrazaMatch) {
    const partySize = parseInt(terrazaMatch[1], 10);
    if (!isNaN(partySize) && partySize > 0) return { tableId: "T", partySize };
  }

  return null;
}
