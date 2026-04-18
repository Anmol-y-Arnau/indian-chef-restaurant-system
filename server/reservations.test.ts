/**
 * Tests for the Reservations module
 * Uses isolated test data with __test__ prefix to avoid contaminating production data
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { reservations } from "../drizzle/schema";
import { like } from "drizzle-orm";
import {
  createReservation,
  getReservationsByDate,
  getReservationById,
  updateReservationStatus,
  deleteReservation,
  getReservationsByDateRange,
} from "./reservationDb";

// ─── Test data ────────────────────────────────────────────────────────────────

const TEST_DATE = "2099-12-25"; // Far future to avoid conflicts
const TEST_DATE_2 = "2099-12-26";

const TEST_RESERVATION = {
  guestName: "__test__ Juan García",
  guestPhone: "+34 600 000 001",
  guestEmail: "test@example.com",
  date: TEST_DATE,
  time: "20:00",
  partySize: 4,
  tableId: null,
  status: "confirmed" as const,
  notes: "Test reservation",
  origin: "manual" as const,
};

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanupTestReservations() {
  const db = await getDb();
  if (!db) return;
  await db.delete(reservations).where(like(reservations.guestName, "__test__%"));
}

beforeAll(async () => {
  await cleanupTestReservations();
});

afterAll(async () => {
  await cleanupTestReservations();
});

// ─── DB Tests ─────────────────────────────────────────────────────────────────

describe("Reservations DB", () => {
  let createdId: number;

  it("should create a reservation", async () => {
    const result = await createReservation(TEST_RESERVATION);
    expect(result).not.toBeNull();
    expect(result!.guestName).toBe(TEST_RESERVATION.guestName);
    expect(result!.guestPhone).toBe(TEST_RESERVATION.guestPhone);
    expect(result!.date).toBe(TEST_DATE);
    expect(result!.time).toBe("20:00");
    expect(result!.partySize).toBe(4);
    expect(result!.status).toBe("confirmed");
    expect(result!.origin).toBe("manual");
    createdId = result!.id;
  });

  it("should get reservation by id", async () => {
    const result = await getReservationById(createdId);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdId);
    expect(result!.guestName).toBe(TEST_RESERVATION.guestName);
  });

  it("should get reservations by date", async () => {
    const results = await getReservationsByDate(TEST_DATE);
    const found = results.find(r => r.id === createdId);
    expect(found).toBeDefined();
    expect(found!.date).toBe(TEST_DATE);
  });

  it("should update reservation status", async () => {
    const updated = await updateReservationStatus(createdId, "seated");
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("seated");
  });

  it("should get reservations by date range", async () => {
    await createReservation({ ...TEST_RESERVATION, date: TEST_DATE_2, time: "21:00" });
    const results = await getReservationsByDateRange(TEST_DATE, TEST_DATE_2);
    const testResults = results.filter(r => r.guestName === TEST_RESERVATION.guestName);
    expect(testResults.length).toBeGreaterThanOrEqual(2);
  });

  it("should delete a reservation", async () => {
    await deleteReservation(createdId);
    const result = await getReservationById(createdId);
    expect(result).toBeNull();
  });
});

// ─── Opening hours logic ──────────────────────────────────────────────────────

describe("Opening hours logic", () => {
  // Helper: get day of week from date string (0=Sun, 1=Mon, ..., 6=Sat)
  function getDow(dateStr: string): number {
    return new Date(dateStr + "T12:00:00").getDay();
  }

  function getTimeSlotsForDate(dateStr: string): string[] {
    const dow = getDow(dateStr);
    if (dow === 2) return []; // Tuesday = closed
    const lunch = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
    const dinnerBase = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];
    const dinnerLate = [...dinnerBase, "23:30"];
    const dinner = (dow === 5 || dow === 6) ? dinnerLate : dinnerBase;
    return [...lunch, ...dinner];
  }

  it("Tuesday should be closed (no slots)", () => {
    // 2026-04-14 is a Tuesday
    const slots = getTimeSlotsForDate("2026-04-14");
    expect(slots).toHaveLength(0);
  });

  it("Wednesday should have standard hours (no 23:30)", () => {
    // 2026-04-15 is a Wednesday
    const slots = getTimeSlotsForDate("2026-04-15");
    expect(slots).toContain("13:00");
    expect(slots).toContain("23:00");
    expect(slots).not.toContain("23:30");
    expect(slots.length).toBe(15); // 6 lunch + 9 dinner
  });

  it("Friday should have extended hours (until 23:30)", () => {
    // 2026-04-17 is a Friday
    const slots = getTimeSlotsForDate("2026-04-17");
    expect(slots).toContain("23:30");
    expect(slots.length).toBe(16); // 6 lunch + 10 dinner
  });

  it("Saturday should have extended hours (until 23:30)", () => {
    // 2026-04-18 is a Saturday
    const slots = getTimeSlotsForDate("2026-04-18");
    expect(slots).toContain("23:30");
    expect(slots.length).toBe(16);
  });

  it("Sunday should have standard hours (no 23:30)", () => {
    // 2026-04-19 is a Sunday
    const slots = getTimeSlotsForDate("2026-04-19");
    expect(slots).not.toContain("23:30");
    expect(slots.length).toBe(15);
  });

  it("Monday should have standard hours (no 23:30)", () => {
    // 2026-04-20 is a Monday
    const slots = getTimeSlotsForDate("2026-04-20");
    expect(slots).not.toContain("23:30");
    expect(slots.length).toBe(15);
  });

  it("Lunch slots should be between 13:00 and 16:00", () => {
    const slots = getTimeSlotsForDate("2026-04-15"); // Wednesday
    const lunch = slots.filter(t => t < "17:00");
    expect(lunch[0]).toBe("13:00");
    expect(lunch[lunch.length - 1]).toBe("15:30");
    expect(lunch.length).toBe(6);
  });

  it("Dinner slots should start at 19:00", () => {
    const slots = getTimeSlotsForDate("2026-04-15"); // Wednesday
    const dinner = slots.filter(t => t >= "17:00");
    expect(dinner[0]).toBe("19:00");
  });
});

// ─── Validation & availability logic ─────────────────────────────────────────

describe("Reservation validation logic", () => {
  it("should validate date format YYYY-MM-DD", () => {
    const valid = ["2026-01-15", "2099-12-31", "2024-02-29"];
    const invalid = ["15-01-2026", "2026/01/15", "20260115", ""];
    for (const d of valid) expect(/^\d{4}-\d{2}-\d{2}$/.test(d)).toBe(true);
    for (const d of invalid) expect(/^\d{4}-\d{2}-\d{2}$/.test(d)).toBe(false);
  });

  it("should validate time format HH:MM", () => {
    const valid = ["20:00", "12:30", "09:00", "23:59"];
    const invalid = ["8:00", "20:0", "2000", "20-00", ""];
    for (const t of valid) expect(/^\d{2}:\d{2}$/.test(t)).toBe(true);
    for (const t of invalid) expect(/^\d{2}:\d{2}$/.test(t)).toBe(false);
  });

  it("should calculate covers per slot correctly (cancelled not counted)", () => {
    const list = [
      { time: "20:00", partySize: 4, status: "confirmed" },
      { time: "20:00", partySize: 6, status: "confirmed" },
      { time: "21:00", partySize: 2, status: "confirmed" },
      { time: "20:00", partySize: 3, status: "cancelled" },
    ];
    const active = list.filter(r => !["cancelled", "no_show"].includes(r.status));
    const covers: Record<string, number> = {};
    for (const r of active) covers[r.time] = (covers[r.time] || 0) + r.partySize;
    expect(covers["20:00"]).toBe(10);
    expect(covers["21:00"]).toBe(2);
    expect(covers["22:00"]).toBeUndefined();
  });

  it("should correctly determine slot availability", () => {
    const MAX = 30;
    const covers: Record<string, number> = { "20:00": 28 };
    expect((covers["20:00"] || 0) + 4 <= MAX).toBe(false); // 32 > 30
    expect((covers["21:00"] || 0) + 4 <= MAX).toBe(true);  // 4 <= 30
  });
});
