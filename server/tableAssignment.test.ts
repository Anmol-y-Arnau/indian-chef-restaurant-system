import { describe, it, expect } from "vitest";
import { assignTable, estimateEndTime, getOccupiedTableIds } from "./tableAssignment";
import { parseWalkInText } from "./walkInDb";
import { getTimeSlotsForDate, isRestaurantOpen, getServicePeriod } from "./reservationUtils";

// ─── assignTable ──────────────────────────────────────────────────────────────

describe("assignTable", () => {
  it("assigns a single table for 1-2 people", () => {
    const result = assignTable(2, new Set());
    expect(result.success).toBe(true);
    expect(result.group).toBeDefined();
    expect(result.group!.capacity).toBeGreaterThanOrEqual(2);
  });

  it("assigns a single table for 4 people", () => {
    const result = assignTable(4, new Set());
    expect(result.success).toBe(true);
    expect(result.group!.capacity).toBeGreaterThanOrEqual(4);
  });

  it("assigns combination for 5-6 people", () => {
    const result = assignTable(6, new Set());
    expect(result.success).toBe(true);
    expect(result.group!.tableIds.length).toBeGreaterThan(1);
    expect(result.group!.capacity).toBeGreaterThanOrEqual(6);
  });

  it("assigns combination for 8 people", () => {
    const result = assignTable(8, new Set());
    expect(result.success).toBe(true);
    expect(result.group!.capacity).toBeGreaterThanOrEqual(8);
  });

  it("assigns combination 5+6+8 for 10 people", () => {
    const result = assignTable(10, new Set());
    expect(result.success).toBe(true);
    expect(result.group!.capacity).toBeGreaterThanOrEqual(10);
  });

  it("fails when all tables are occupied", () => {
    const allOccupied = new Set(["0+", "0-", "1", "2", "3", "4", "5", "6", "7", "8", "T"]);
    const result = assignTable(2, allOccupied);
    expect(result.success).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it("skips occupied tables and uses alternatives", () => {
    const occupied = new Set(["0+"]);
    const result = assignTable(2, occupied);
    expect(result.success).toBe(true);
    expect(result.group!.tableIds).not.toContain("0+");
  });

  it("skips combination if any table is occupied", () => {
    const occupied = new Set(["0+"]);
    const result = assignTable(6, occupied);
    if (result.success) {
      expect(result.group!.tableIds).not.toContain("0+");
    }
  });

  it("fails gracefully for party size > 14", () => {
    const result = assignTable(15, new Set());
    expect(result.success).toBe(false);
  });
});

// ─── estimateEndTime ──────────────────────────────────────────────────────────

describe("estimateEndTime", () => {
  it("adds 90 minutes correctly", () => {
    expect(estimateEndTime("13:00", 90)).toBe("14:30");
    expect(estimateEndTime("19:00", 90)).toBe("20:30");
    expect(estimateEndTime("22:00", 90)).toBe("23:30");
  });

  it("handles hour overflow", () => {
    expect(estimateEndTime("23:00", 90)).toBe("00:30");
  });
});

// ─── getOccupiedTableIds ──────────────────────────────────────────────────────

describe("getOccupiedTableIds", () => {
  it("returns empty set when no slots", () => {
    const result = getOccupiedTableIds([], "2026-04-18", "13:00");
    expect(result.size).toBe(0);
  });

  it("returns occupied tables for a given time slot", () => {
    const slots = [
      { date: "2026-04-18", time: "13:00", tableIds: ["2", "3"], estimatedEnd: null },
      { date: "2026-04-18", time: "14:00", tableIds: ["5"], estimatedEnd: null },
    ];
    const result = getOccupiedTableIds(slots, "2026-04-18", "13:00");
    expect(result.has("2")).toBe(true);
    expect(result.has("3")).toBe(true);
    expect(result.has("5")).toBe(false);
  });
});

// ─── parseWalkInText ──────────────────────────────────────────────────────────

describe("parseWalkInText", () => {
  it("parses 'mesa 2 3 personas'", () => {
    const result = parseWalkInText("mesa 2 3 personas");
    expect(result).not.toBeNull();
    expect(result!.tableId).toBe("2");
    expect(result!.partySize).toBe(3);
  });

  it("parses 'terraza 4 personas'", () => {
    const result = parseWalkInText("terraza 4 personas");
    expect(result).not.toBeNull();
    expect(result!.tableId).toBe("T");
    expect(result!.partySize).toBe(4);
  });

  it("parses 'mesa 0+ 2 personas'", () => {
    const result = parseWalkInText("mesa 0+ 2 personas");
    expect(result).not.toBeNull();
    expect(result!.tableId).toBe("0+");
    expect(result!.partySize).toBe(2);
  });

  it("returns null for invalid text", () => {
    expect(parseWalkInText("hola mundo")).toBeNull();
    expect(parseWalkInText("")).toBeNull();
  });
});

// ─── reservationUtils ─────────────────────────────────────────────────────────

describe("getTimeSlotsForDate", () => {
  it("returns empty array for Tuesday (closed)", () => {
    // 2026-04-21 is a Tuesday
    expect(getTimeSlotsForDate("2026-04-21")).toHaveLength(0);
  });

  it("returns slots for Wednesday", () => {
    // 2026-04-22 is a Wednesday
    const slots = getTimeSlotsForDate("2026-04-22");
    expect(slots.length).toBeGreaterThan(0);
    expect(slots).toContain("13:00");
    expect(slots).toContain("19:00");
    expect(slots).not.toContain("23:30");
  });

  it("returns extended slots for Friday", () => {
    // 2026-04-24 is a Friday
    const slots = getTimeSlotsForDate("2026-04-24");
    expect(slots).toContain("23:30");
  });

  it("returns extended slots for Saturday", () => {
    // 2026-04-25 is a Saturday
    const slots = getTimeSlotsForDate("2026-04-25");
    expect(slots).toContain("23:30");
  });
});

describe("isRestaurantOpen", () => {
  it("returns false for Tuesday", () => {
    expect(isRestaurantOpen("2026-04-21")).toBe(false);
  });

  it("returns true for Wednesday", () => {
    expect(isRestaurantOpen("2026-04-22")).toBe(true);
  });
});

describe("getServicePeriod", () => {
  it("returns lunch for 13:00-16:00", () => {
    expect(getServicePeriod("13:00")).toBe("lunch");
    expect(getServicePeriod("15:30")).toBe("lunch");
  });

  it("returns dinner for 19:00-23:30", () => {
    expect(getServicePeriod("19:00")).toBe("dinner");
    expect(getServicePeriod("23:30")).toBe("dinner");
  });

  it("returns null for off-hours", () => {
    expect(getServicePeriod("12:00")).toBeNull();
    expect(getServicePeriod("17:00")).toBeNull();
  });
});
