/**
 * Tests for the Reservations module
 * Uses isolated test data with __test__ prefix to avoid contaminating production data
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { reservations } from "../drizzle/schema";
import { eq, like } from "drizzle-orm";
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

// ─── Tests ────────────────────────────────────────────────────────────────────

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
    // Create a second reservation on a different date
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

describe("Reservation validation logic", () => {
  it("should validate date format YYYY-MM-DD", () => {
    const validDates = ["2026-01-15", "2099-12-31", "2024-02-29"];
    const invalidDates = ["15-01-2026", "2026/01/15", "20260115", ""];
    for (const d of validDates) {
      expect(/^\d{4}-\d{2}-\d{2}$/.test(d)).toBe(true);
    }
    for (const d of invalidDates) {
      expect(/^\d{4}-\d{2}-\d{2}$/.test(d)).toBe(false);
    }
  });

  it("should validate time format HH:MM", () => {
    const validTimes = ["20:00", "12:30", "09:00", "23:59"];
    const invalidTimes = ["8:00", "20:0", "2000", "20-00", ""];
    for (const t of validTimes) {
      expect(/^\d{2}:\d{2}$/.test(t)).toBe(true);
    }
    for (const t of invalidTimes) {
      expect(/^\d{2}:\d{2}$/.test(t)).toBe(false);
    }
  });

  it("should calculate covers per slot correctly", () => {
    const reservationsList = [
      { time: "20:00", partySize: 4, status: "confirmed" },
      { time: "20:00", partySize: 6, status: "confirmed" },
      { time: "21:00", partySize: 2, status: "confirmed" },
      { time: "20:00", partySize: 3, status: "cancelled" }, // Should not count
    ];

    const activeReservations = reservationsList.filter(
      r => !["cancelled", "no_show"].includes(r.status)
    );

    const coversPerSlot: Record<string, number> = {};
    for (const r of activeReservations) {
      coversPerSlot[r.time] = (coversPerSlot[r.time] || 0) + r.partySize;
    }

    expect(coversPerSlot["20:00"]).toBe(10); // 4 + 6 (cancelled not counted)
    expect(coversPerSlot["21:00"]).toBe(2);
    expect(coversPerSlot["22:00"]).toBeUndefined();
  });

  it("should correctly determine slot availability", () => {
    const MAX_COVERS = 30;
    const coversPerSlot: Record<string, number> = { "20:00": 28 };
    const partySize = 4;

    // 28 + 4 = 32 > 30, should not be available
    const slot2000Available = (coversPerSlot["20:00"] || 0) + partySize <= MAX_COVERS;
    expect(slot2000Available).toBe(false);

    // 0 + 4 = 4 <= 30, should be available
    const slot2100Available = (coversPerSlot["21:00"] || 0) + partySize <= MAX_COVERS;
    expect(slot2100Available).toBe(true);
  });
});
