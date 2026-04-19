/**
 * Table Assignment Engine — Indian Chef Restaurant
 *
 * Restaurant layout (interior, 8 tables):
 *   Zone A (downstairs/entrance):
 *     0+  → 2 pax (small square table)
 *     0-  → 4 pax (rectangular table)
 *     1   → 4 pax (actually 2×2-pax tables pushed together, flexible)
 *
 *   Zone B (middle row):
 *     2   → 4 pax
 *     3   → 4 pax
 *     4   → 4 pax
 *
 *   Zone C (back/upstairs):
 *     5   → 4 pax
 *     6   → 4 pax
 *     7   → 4 pax
 *     8   → 2 pax (isolated, can join with 6)
 *
 *   Terraza (exterior, unnumbered):
 *     T   → 4 pax (weather-dependent, treated as independent)
 *
 * Combination rules (in priority order):
 *   1–2  pax  → any single table (prefer 0+ or 8 first to save bigger tables)
 *   3–4  pax  → any single 4-pax table
 *   5–6  pax  → 0+ + 0-  (zone A combined, 6 pax)
 *              OR  6 + 8  (zone C combined, 6 pax)
 *   7–8  pax  → 5 + 6    (zone C combined, 8 pax)
 *              OR  0+ + 0- + part of 1  (zone A combined, 8 pax)
 *   9–10 pax  → 5 + 6 + 8  (zone C combined, 10 pax)
 *   11+  pax  → not possible without external arrangement
 */

export interface TableDef {
  id: string;
  label: string;
  baseCapacity: number;
  zone: "A" | "B" | "C" | "T";
}

export interface TableGroup {
  /** Unique name for this combination */
  name: string;
  /** Table IDs involved */
  tableIds: string[];
  /** Total capacity when combined */
  capacity: number;
  /** Minimum party size this group is suitable for */
  minParty: number;
  /** Maximum party size this group can seat */
  maxParty: number;
  /** Priority: lower = prefer first */
  priority: number;
}

export interface OccupiedSlot {
  tableIds: string[];
  partySize: number;
  /** ISO date string YYYY-MM-DD */
  date: string;
  /** HH:MM */
  time: string;
  /** Estimated end time HH:MM (null = no limit) */
  estimatedEnd?: string | null;
  /** walk-in or reservation */
  type: "reservation" | "walkin";
  reservationId?: number;
}

export interface AssignmentResult {
  success: boolean;
  group?: TableGroup;
  /** Human-readable instruction for the host */
  instruction?: string;
  reason?: string;
}

// ─── Table definitions ────────────────────────────────────────────────────────

export const TABLES: TableDef[] = [
  { id: "0+", label: "0+",      baseCapacity: 2, zone: "A" },
  { id: "0-", label: "0-",      baseCapacity: 4, zone: "A" },
  { id: "1",  label: "1",       baseCapacity: 4, zone: "A" },
  { id: "2",  label: "2",       baseCapacity: 4, zone: "B" },
  { id: "3",  label: "3",       baseCapacity: 4, zone: "B" },
  { id: "4",  label: "4",       baseCapacity: 4, zone: "B" },
  { id: "5",  label: "5",       baseCapacity: 4, zone: "C" },
  { id: "6",  label: "6",       baseCapacity: 4, zone: "C" },
  { id: "7",  label: "7",       baseCapacity: 4, zone: "C" },
  { id: "8",  label: "8",       baseCapacity: 2, zone: "C" },
  { id: "T",  label: "Terraza", baseCapacity: 4, zone: "T" },
];

// ─── Combination groups (ordered by priority) ────────────────────────────────

export const TABLE_GROUPS: TableGroup[] = [
  // Single tables — small parties first
  { name: "Mesa 0+",      tableIds: ["0+"],         capacity: 2,  minParty: 1, maxParty: 2,  priority: 10 },
  { name: "Mesa 8",       tableIds: ["8"],           capacity: 2,  minParty: 1, maxParty: 2,  priority: 11 },
  { name: "Mesa 2",       tableIds: ["2"],           capacity: 4,  minParty: 2, maxParty: 4,  priority: 20 },
  { name: "Mesa 3",       tableIds: ["3"],           capacity: 4,  minParty: 2, maxParty: 4,  priority: 21 },
  { name: "Mesa 4",       tableIds: ["4"],           capacity: 4,  minParty: 2, maxParty: 4,  priority: 22 },
  { name: "Mesa 7",       tableIds: ["7"],           capacity: 4,  minParty: 2, maxParty: 4,  priority: 23 },
  { name: "Mesa 0-",      tableIds: ["0-"],          capacity: 4,  minParty: 2, maxParty: 4,  priority: 24 },
  { name: "Mesa 5",       tableIds: ["5"],           capacity: 4,  minParty: 2, maxParty: 4,  priority: 25 },
  { name: "Mesa 6",       tableIds: ["6"],           capacity: 4,  minParty: 2, maxParty: 4,  priority: 26 },
  { name: "Mesa 1",       tableIds: ["1"],           capacity: 4,  minParty: 2, maxParty: 4,  priority: 27 },
  { name: "Terraza",      tableIds: ["T"],           capacity: 4,  minParty: 1, maxParty: 4,  priority: 30 },
  // 6-pax combinations
  { name: "Mesas 0+ y 0- juntas",  tableIds: ["0+", "0-"],     capacity: 6,  minParty: 5, maxParty: 6,  priority: 40 },
  { name: "Mesas 6 y 8 juntas",    tableIds: ["6", "8"],       capacity: 6,  minParty: 5, maxParty: 6,  priority: 41 },
  // 8-pax combinations
  { name: "Mesas 5 y 6 juntas",           tableIds: ["5", "6"],           capacity: 8,  minParty: 7, maxParty: 8,  priority: 50 },
  { name: "Mesas 0+, 0- y 1 juntas",      tableIds: ["0+", "0-", "1"],    capacity: 8,  minParty: 7, maxParty: 8,  priority: 51 },
  // 10-pax combination
  { name: "Mesas 5, 6 y 8 juntas",        tableIds: ["5", "6", "8"],      capacity: 10, minParty: 9, maxParty: 10, priority: 60 },
  // 12-pax (all zone C + zone A combined)
  { name: "Zona trasera completa (5+6+8) y delantera (0++0-)", tableIds: ["5", "6", "8", "0+", "0-"], capacity: 14, minParty: 11, maxParty: 14, priority: 70 },
];

/**
 * Alias de TABLES con campo `capacity` para compatibilidad con el agente de WhatsApp.
 * `capacity` = baseCapacity de cada mesa individual.
 */
export const RESTAURANT_TABLES: Array<{ id: string; label: string; capacity: number; zone: string }> =
  TABLES.map(t => ({ id: t.id, label: t.label, capacity: t.baseCapacity, zone: t.zone }));

// ─── Core assignment logic ────────────────────────────────────────────────────

/**
 * Given a party size and the currently occupied table IDs at a specific time slot,
 * returns the best table group assignment or explains why it's not possible.
 */
export function assignTable(
  partySize: number,
  occupiedTableIds: Set<string>
): AssignmentResult {
  if (partySize < 1) return { success: false, reason: "El número de personas debe ser al menos 1" };
  if (partySize > 14) return { success: false, reason: `No podemos acomodar grupos de más de 14 personas en el interior. Para ${partySize} personas, contacta directamente con el restaurante.` };

  // Find eligible groups: capacity fits party size AND all tables are free
  const eligible = TABLE_GROUPS.filter(g =>
    g.minParty <= partySize &&
    g.maxParty >= partySize &&
    g.tableIds.every(id => !occupiedTableIds.has(id))
  );

  if (eligible.length === 0) {
    // Check if any group fits the party size at all (ignoring occupancy)
    const anyFit = TABLE_GROUPS.some(g => g.minParty <= partySize && g.maxParty >= partySize);
    if (!anyFit) {
      return { success: false, reason: `No hay configuración de mesas para ${partySize} personas. Contacta directamente.` };
    }
    return { success: false, reason: `No hay mesas disponibles para ${partySize} personas en este horario. El restaurante está completo.` };
  }

  // Pick the highest-priority (lowest number) eligible group
  const best = eligible.sort((a, b) => a.priority - b.priority)[0];

  const instruction = buildInstruction(best, partySize);
  return { success: true, group: best, instruction };
}

/**
 * Build a human-readable instruction for the host.
 */
function buildInstruction(group: TableGroup, partySize: number): string {
  if (group.tableIds.length === 1) {
    const id = group.tableIds[0];
    return id === "T"
      ? `Sentar en la terraza (${partySize} ${partySize === 1 ? "persona" : "personas"})`
      : `Sentar en mesa ${id} (${partySize} ${partySize === 1 ? "persona" : "personas"})`;
  }
  const tableList = group.tableIds.map(id => `mesa ${id}`).join(" + ");
  return `Juntar ${tableList} → ${group.name} para ${partySize} personas`;
}

/**
 * Check how many covers are already booked/seated at a given time slot.
 * Returns the set of occupied table IDs.
 */
export function getOccupiedTableIds(slots: OccupiedSlot[], date: string, time: string): Set<string> {
  const occupied = new Set<string>();
  for (const slot of slots) {
    if (slot.date !== date) continue;
    // Check if the slot overlaps with the requested time
    // We consider a slot active if: slot.time <= time < slot.estimatedEnd (or no end)
    if (slot.time > time) continue;
    if (slot.estimatedEnd && slot.estimatedEnd <= time) continue;
    for (const id of slot.tableIds) occupied.add(id);
  }
  return occupied;
}

/**
 * Check availability for all time slots on a given date.
 * Returns a map of time → { available: bool, maxPartySize: number, reason?: string }
 */
export function checkAvailabilityForDate(
  slots: OccupiedSlot[],
  date: string,
  partySize: number,
  timeSlots: string[]
): Record<string, { available: boolean; maxPartySize: number; instruction?: string; reason?: string }> {
  const result: Record<string, { available: boolean; maxPartySize: number; instruction?: string; reason?: string }> = {};
  for (const time of timeSlots) {
    const occupied = getOccupiedTableIds(slots, date, time);
    const assignment = assignTable(partySize, occupied);
    // Also compute max party size possible at this slot
    let maxParty = 0;
    for (let n = 1; n <= 14; n++) {
      const a = assignTable(n, occupied);
      if (a.success) maxParty = n;
    }
    result[time] = {
      available: assignment.success,
      maxPartySize: maxParty,
      instruction: assignment.instruction,
      reason: assignment.reason,
    };
  }
  return result;
}

/**
 * Estimate end time given start time and duration in minutes.
 */
export function estimateEndTime(time: string, durationMinutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

/**
 * Default table duration: 90 minutes on peak days (Fri/Sat), 0 (no limit) otherwise.
 * Returns duration in minutes, or null for no limit.
 */
export function getDefaultDuration(date: string, isPeakDay: boolean): number | null {
  if (isPeakDay) return 90;
  return null; // No time limit on regular days
}
