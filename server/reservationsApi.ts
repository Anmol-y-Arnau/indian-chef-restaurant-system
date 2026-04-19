/**
 * Public REST API for reservations
 * This endpoint allows external websites (e.g., the restaurant's booking page)
 * to create and query reservations using an API key.
 *
 * Authentication: Bearer token via Authorization header
 *   Authorization: Bearer <RESERVATIONS_API_KEY>
 *
 * Endpoints:
 *   POST   /api/reservations        → Create a new reservation
 *   GET    /api/reservations?date=  → Get reservations for a date (YYYY-MM-DD)
 *   GET    /api/reservations/availability?date=&partySize= → Check availability
 */

import type { Express, Request, Response } from "express";
import { createReservation, getReservationsByDate } from "./reservationDb";

// ─── Validation helpers ───────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeStr(v: unknown, maxLen = 255): string {
  return String(v ?? "").slice(0, maxLen).trim();
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireApiKey(req: Request, res: Response): boolean {
  const apiKey = process.env.RESERVATIONS_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "Reservations API not configured" });
    return false;
  }
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || token !== apiKey) {
    res.status(401).json({ error: "Invalid or missing API key" });
    return false;
  }
  return true;
}

// ─── Register routes ──────────────────────────────────────────────────────────

export function registerReservationsApi(app: Express) {

  // POST /api/reservations — Create a reservation from external website
  app.post("/api/reservations", async (req: Request, res: Response) => {
    if (!requireApiKey(req, res)) return;
    try {
      const body = req.body as Record<string, unknown>;

      // Required fields presence check
      if (!body.guestName || !body.guestPhone || !body.date || !body.time || !body.partySize) {
        res.status(400).json({
          error: "Missing required fields: guestName, guestPhone, date, time, partySize",
        });
        return;
      }

      // Sanitize and validate each field
      const guestName = sanitizeStr(body.guestName, 120);
      const guestPhone = sanitizeStr(body.guestPhone, 30);
      const date = sanitizeStr(body.date, 10);
      const time = sanitizeStr(body.time, 5);
      const notes = body.notes ? sanitizeStr(body.notes, 500) : null;
      const tableId = body.tableId ? sanitizeStr(body.tableId, 10) : null;

      if (guestName.length < 1) {
        res.status(400).json({ error: "guestName must not be empty" });
        return;
      }
      if (guestPhone.length < 1) {
        res.status(400).json({ error: "guestPhone must not be empty" });
        return;
      }
      if (!DATE_RE.test(date)) {
        res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
        return;
      }
      if (!TIME_RE.test(time)) {
        res.status(400).json({ error: "Invalid time format. Use HH:MM" });
        return;
      }

      // Email: optional but must be valid if provided
      let guestEmail: string | null = null;
      if (body.guestEmail) {
        const raw = sanitizeStr(body.guestEmail, 254);
        if (!EMAIL_RE.test(raw)) {
          res.status(400).json({ error: "Invalid email format" });
          return;
        }
        guestEmail = raw;
      }

      // partySize: must be integer 1–50
      const partySize = parseInt(String(body.partySize), 10);
      if (isNaN(partySize) || partySize < 1 || partySize > 50) {
        res.status(400).json({ error: "partySize must be an integer between 1 and 50" });
        return;
      }

      const reservation = await createReservation({
        guestName,
        guestPhone,
        guestEmail,
        date,
        time,
        partySize,
        tableId,
        notes,
        status: "pending",
        origin: "web",
      });

      res.status(201).json({ success: true, reservation });
    } catch (err) {
      console.error("[Reservations API] Error creating reservation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/reservations?date=YYYY-MM-DD — List reservations for a date
  app.get("/api/reservations", async (req: Request, res: Response) => {
    if (!requireApiKey(req, res)) return;
    try {
      const date = sanitizeStr(req.query.date, 10);
      if (!date || !DATE_RE.test(date)) {
        res.status(400).json({ error: "Missing or invalid ?date=YYYY-MM-DD query param" });
        return;
      }
      const reservations = await getReservationsByDate(date);
      // Return only non-sensitive fields for external use
      const safe = reservations.map(r => ({
        id: r.id,
        date: r.date,
        time: r.time,
        partySize: r.partySize,
        status: r.status,
        tableId: r.tableId,
      }));
      res.json({ date, reservations: safe });
    } catch (err) {
      console.error("[Reservations API] Error fetching reservations:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/reservations/availability?date=YYYY-MM-DD&partySize=N
  // Returns available time slots for a given date and party size
  app.get("/api/reservations/availability", async (req: Request, res: Response) => {
    if (!requireApiKey(req, res)) return;
    try {
      const date = sanitizeStr(req.query.date, 10);
      const rawPartySize = parseInt(String(req.query.partySize || "2"), 10);

      if (!date || !DATE_RE.test(date)) {
        res.status(400).json({ error: "Missing or invalid ?date=YYYY-MM-DD query param" });
        return;
      }
      if (isNaN(rawPartySize) || rawPartySize < 1 || rawPartySize > 50) {
        res.status(400).json({ error: "partySize must be an integer between 1 and 50" });
        return;
      }

      const partySize = rawPartySize;
      const reservations = await getReservationsByDate(date);
      const activeReservations = reservations.filter(
        r => !["cancelled", "no_show"].includes(r.status)
      );

      // All possible time slots
      const ALL_SLOTS = [
        "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "19:00", "19:30", "20:00", "20:30",
        "21:00", "21:30", "22:00", "22:30", "23:00",
      ];

      // Count covers per slot
      const coversPerSlot: Record<string, number> = {};
      for (const r of activeReservations) {
        coversPerSlot[r.time] = (coversPerSlot[r.time] || 0) + r.partySize;
      }

      // Max capacity per slot (configurable, default 30 covers)
      const MAX_COVERS_PER_SLOT = 30;

      const slots = ALL_SLOTS.map(time => ({
        time,
        available: (coversPerSlot[time] || 0) + partySize <= MAX_COVERS_PER_SLOT,
        currentCovers: coversPerSlot[time] || 0,
      }));

      res.json({ date, partySize, slots });
    } catch (err) {
      console.error("[Reservations API] Error checking availability:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
