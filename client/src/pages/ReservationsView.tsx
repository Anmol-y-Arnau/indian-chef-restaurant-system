import { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Users, Phone, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, User, Trash2, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReservationStatus = "pending" | "confirmed" | "seated" | "cancelled" | "no_show" | "finished";

interface Reservation {
  id: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  date: string;
  time: string;
  partySize: number;
  tableId?: string | null;
  assignedTableIds?: string | null;
  assignmentInstruction?: string | null;
  estimatedEnd?: string | null;
  status: ReservationStatus;
  notes?: string | null;
  origin: "manual" | "web" | "phone";
  createdAt: Date;
  updatedAt: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<ReservationStatus, { bg: string; border: string; text: string; dot: string }> = {
  pending:   { bg: "bg-yellow-500/25",  border: "border-yellow-400",  text: "text-yellow-100",  dot: "bg-yellow-400" },
  confirmed: { bg: "bg-green-500/25",   border: "border-green-400",   text: "text-green-100",   dot: "bg-green-400" },
  seated:    { bg: "bg-blue-500/25",    border: "border-blue-400",    text: "text-blue-100",    dot: "bg-blue-400" },
  cancelled: { bg: "bg-red-500/15",     border: "border-red-400/50",  text: "text-red-300/60",  dot: "bg-red-400" },
  no_show:   { bg: "bg-gray-500/15",    border: "border-gray-400/50", text: "text-gray-400/60", dot: "bg-gray-400" },
  finished:  { bg: "bg-emerald-500/15", border: "border-emerald-600", text: "text-emerald-300/60", dot: "bg-emerald-600" },
};

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pendiente", confirmed: "Confirmada", seated: "Sentada",
  cancelled: "Cancelada", no_show: "No apareció", finished: "Finalizada",
};

// Restaurant hours: 13:00–16:00 and 19:00–23:30
// We show 12:00–24:00 (midnight) so there's context
const HOUR_START = 12;
const HOUR_END   = 24;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const PX_PER_HOUR = 80; // height in px per hour

const LUNCH_SLOTS  = ["13:00","13:30","14:00","14:30","15:00","15:30"];
const DINNER_BASE  = ["19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00"];
const DINNER_LATE  = [...DINNER_BASE, "23:30"];

function getSlotsForDate(dateStr: string): string[] {
  const dow = new Date(dateStr + "T12:00:00").getDay();
  if (dow === 2) return [];
  const dinner = (dow === 5 || dow === 6) ? DINNER_LATE : DINNER_BASE;
  return [...LUNCH_SLOTS, ...dinner];
}

function isClosedDay(dateStr: string): boolean {
  return new Date(dateStr + "T12:00:00").getDay() === 2;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWeekDays(anchorDate: string): string[] {
  const d = new Date(anchorDate + "T12:00:00");
  const dow = (d.getDay() + 6) % 7; // 0=Mon
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToPx(minutes: number): number {
  const offsetFromStart = minutes - HOUR_START * 60;
  return (offsetFromStart / 60) * PX_PER_HOUR;
}

function formatDayHeader(dateStr: string): { dow: string; day: number; isToday: boolean } {
  const d = new Date(dateStr + "T12:00:00");
  const dows = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return {
    dow: dows[d.getDay()],
    day: d.getDate(),
    isToday: dateStr === todayStr(),
  };
}

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Mini Month Calendar ──────────────────────────────────────────────────────

function MiniCalendar({
  anchorDate,
  onSelectDate,
  reservationsByDate,
}: {
  anchorDate: string;
  onSelectDate: (d: string) => void;
  reservationsByDate: Record<string, number>;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(anchorDate + "T12:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const today = todayStr();
  const weekDays = getWeekDays(anchorDate);

  const firstDay = new Date(viewDate.year, viewDate.month, 1);
  const lastDay = new Date(viewDate.year, viewDate.month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => new Date(viewDate.year, viewDate.month, i + 1)),
  ];

  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DOW = ["L","M","X","J","V","S","D"];

  const prevMonth = () => {
    if (viewDate.month === 0) setViewDate({ year: viewDate.year - 1, month: 11 });
    else setViewDate(v => ({ ...v, month: v.month - 1 }));
  };
  const nextMonth = () => {
    if (viewDate.month === 11) setViewDate({ year: viewDate.year + 1, month: 0 });
    else setViewDate(v => ({ ...v, month: v.month + 1 }));
  };

  return (
    <div className="px-3 py-2 select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <span className="text-xs font-semibold text-white/80">{MONTHS[viewDate.month]} {viewDate.year}</span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-white/10 transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      {/* DOW headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {DOW.map((d, i) => (
          <div key={i} className={cn("text-center text-[10px] font-medium py-0.5", i === 1 ? "text-red-400/70" : "text-muted-foreground/60")}>{d}</div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = d.toISOString().slice(0, 10);
          const isToday = ds === today;
          const inWeek = weekDays.includes(ds);
          const isClosed = d.getDay() === 2;
          const count = reservationsByDate[ds] ?? 0;

          return (
            <button
              key={ds}
              onClick={() => onSelectDate(ds)}
              disabled={isClosed}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-full w-7 h-7 mx-auto text-[11px] font-medium transition-all",
                isClosed && "opacity-20 cursor-not-allowed",
                isToday && "bg-primary text-primary-foreground",
                inWeek && !isToday && "bg-white/15 text-white",
                !isToday && !inWeek && !isClosed && "text-muted-foreground hover:bg-white/10 hover:text-white",
              )}
            >
              {d.getDate()}
              {count > 0 && !isClosed && (
                <span className={cn(
                  "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                  isToday ? "bg-white" : "bg-primary"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reservation Detail Popover ───────────────────────────────────────────────

function ReservationPopover({
  r,
  onClose,
  onStatusChange,
  onDelete,
}: {
  r: Reservation;
  onClose: () => void;
  onStatusChange: (id: number, status: ReservationStatus) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = STATUS_COLORS[r.status];
  const tables = r.assignedTableIds ? JSON.parse(r.assignedTableIds) as string[] : r.tableId ? [r.tableId] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#1e1e2e] border border-white/20 rounded-2xl shadow-2xl p-4 w-72 z-50"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full flex-shrink-0", cfg.dot)} />
            <span className="font-semibold text-sm text-white">{r.guestName}</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors text-lg leading-none">×</button>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" />{r.partySize} personas</div>
          {r.guestPhone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{r.guestPhone}</div>}
          {tables.length > 0 && <div className="flex items-center gap-2 text-amber-400"><span>🪑</span> Mesa {tables.join(" + ")}</div>}
          {r.assignmentInstruction && <p className="text-amber-300/80 bg-amber-400/10 rounded px-2 py-1">{r.assignmentInstruction}</p>}
          {r.notes && <p className="italic">"{r.notes}"</p>}
          <div className="text-[10px] text-white/30">{STATUS_LABELS[r.status]}</div>
        </div>

        {/* Actions */}
        {r.status !== "cancelled" && r.status !== "no_show" && r.status !== "finished" && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {r.status === "pending" && (
              <button onClick={() => { onStatusChange(r.id, "confirmed"); onClose(); }}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                <CheckCircle2 className="w-3 h-3" /> Confirmar
              </button>
            )}
            {(r.status === "pending" || r.status === "confirmed") && (
              <button onClick={() => { onStatusChange(r.id, "seated"); onClose(); }}
                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                <User className="w-3 h-3" /> Sentado
              </button>
            )}
            <button onClick={() => { onStatusChange(r.id, "cancelled"); onClose(); }}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
              <XCircle className="w-3 h-3" /> Cancelar
            </button>
          </div>
        )}
        <button onClick={() => { onDelete(r.id); onClose(); }}
          className="flex items-center gap-1 text-[11px] text-red-400/60 hover:text-red-400 transition-colors">
          <Trash2 className="w-3 h-3" /> Eliminar reserva
        </button>
      </div>
    </div>
  );
}

// ─── Add Reservation Dialog ───────────────────────────────────────────────────

function AddReservationDialog({
  open,
  onClose,
  defaultDate,
  defaultTime,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  defaultTime?: string;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    guestName: "",
    guestPhone: "",
    date: defaultDate,
    time: defaultTime ?? "",
    partySize: "2",
    notes: "",
  });

  // Sync defaultDate/defaultTime when dialog opens
  useEffect(() => {
    if (open) {
      setForm(f => ({ ...f, date: defaultDate, time: defaultTime ?? f.time }));
    }
  }, [open, defaultDate, defaultTime]);

  const slots = getSlotsForDate(form.date);
  const lunchSlots = slots.filter(s => LUNCH_SLOTS.includes(s));
  const dinnerSlots = slots.filter(s => !LUNCH_SLOTS.includes(s));

  const createMut = trpc.reservations.create.useMutation({
    onSuccess: () => {
      toast.success("Reserva añadida");
      onSuccess();
      onClose();
      setForm({ guestName: "", guestPhone: "", date: defaultDate, time: "", partySize: "2", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.guestName.trim()) return toast.error("Nombre obligatorio");
    if (!form.date) return toast.error("Fecha obligatoria");
    if (!form.time) return toast.error("Selecciona una hora");
    createMut.mutate({
      guestName: form.guestName.trim(),
      guestPhone: form.guestPhone.trim(),
      date: form.date,
      time: form.time,
      partySize: parseInt(form.partySize),
      notes: form.notes.trim() || undefined,
      origin: "manual",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm bg-[#1a1a2e] border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Nueva Reserva</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Nombre *</Label>
            <Input value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
              placeholder="Nombre del cliente" className="bg-white/5 border-white/20 text-white" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Teléfono</Label>
            <Input value={form.guestPhone} onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))}
              placeholder="612 345 678" className="bg-white/5 border-white/20 text-white" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Fecha *</Label>
              <Input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value, time: "" }))}
                className="bg-white/5 border-white/20 text-white" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Personas *</Label>
              <Select value={form.partySize} onValueChange={v => setForm(f => ({ ...f, partySize: v }))}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} personas</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Hora *</Label>
            {isClosedDay(form.date) ? (
              <p className="text-sm text-red-400 py-1">Martes — restaurante cerrado</p>
            ) : (
              <div className="space-y-2">
                {lunchSlots.length > 0 && (
                  <div>
                    <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">🌞 Comida</p>
                    <div className="flex flex-wrap gap-1.5">
                      {lunchSlots.map(s => (
                        <button key={s} onClick={() => setForm(f => ({ ...f, time: s }))}
                          className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                            form.time === s ? "bg-orange-500 text-white" : "bg-white/8 text-muted-foreground hover:bg-white/15"
                          )}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {dinnerSlots.length > 0 && (
                  <div>
                    <p className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1">🌙 Cena</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dinnerSlots.map(s => (
                        <button key={s} onClick={() => setForm(f => ({ ...f, time: s }))}
                          className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                            form.time === s ? "bg-indigo-500 text-white" : "bg-white/8 text-muted-foreground hover:bg-white/15"
                          )}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Notas</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Alergias, ocasión especial..." className="bg-white/5 border-white/20 text-white" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createMut.isPending} className="bg-primary text-primary-foreground">
            {createMut.isPending ? "Guardando..." : "Añadir Reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Overlap layout calculation ──────────────────────────────────────────────

interface LayoutBlock {
  r: Reservation;
  col: number;
  totalCols: number;
  startMin: number;
  endMin: number;
}

/**
 * Groups reservations into overlapping clusters and assigns each a column
 * so they sit side by side instead of stacking on top of each other.
 */
function computeLayout(reservations: Reservation[]): LayoutBlock[] {
  // Sort by start time
  const sorted = [...reservations].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const blocks: LayoutBlock[] = sorted.map(r => ({
    r,
    col: 0,
    totalCols: 1,
    startMin: timeToMinutes(r.time),
    endMin: r.estimatedEnd ? timeToMinutes(r.estimatedEnd) : timeToMinutes(r.time) + 90,
  }));

  // Greedy column assignment: for each block, find the first column not
  // occupied by any overlapping block that was already placed.
  for (let i = 0; i < blocks.length; i++) {
    const usedCols = new Set<number>();
    for (let j = 0; j < i; j++) {
      if (blocks[j].endMin > blocks[i].startMin && blocks[j].startMin < blocks[i].endMin) {
        usedCols.add(blocks[j].col);
      }
    }
    let col = 0;
    while (usedCols.has(col)) col++;
    blocks[i].col = col;
  }

  // Compute totalCols per overlapping cluster
  for (let i = 0; i < blocks.length; i++) {
    let maxCol = blocks[i].col;
    for (let j = 0; j < blocks.length; j++) {
      if (i !== j && blocks[j].endMin > blocks[i].startMin && blocks[j].startMin < blocks[i].endMin) {
        maxCol = Math.max(maxCol, blocks[j].col);
      }
    }
    blocks[i].totalCols = maxCol + 1;
  }

  return blocks;
}

// ─── Week Grid ────────────────────────────────────────────────────────────────

function WeekGrid({
  weekDays,
  reservationsByDate,
  onClickSlot,
  onClickReservation,
}: {
  weekDays: string[];
  reservationsByDate: Record<string, Reservation[]>;
  onClickSlot: (date: string, time: string) => void;
  onClickReservation: (r: Reservation) => void;
}) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i);
  const totalHeight = TOTAL_HOURS * PX_PER_HOUR;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 12:30 on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0.5 * PX_PER_HOUR;
    }
  }, []);

  // Shade lunch and dinner zones
  const LUNCH_START = 13, LUNCH_END = 16;
  const DINNER_START = 19, DINNER_END = 23.5;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-white/10 flex-shrink-0 bg-[#0f0f1a]">
        <div className="w-14 flex-shrink-0" /> {/* time gutter */}
        {weekDays.map(ds => {
          const { dow, day, isToday } = formatDayHeader(ds);
          const closed = isClosedDay(ds);
          return (
            <div key={ds} className={cn("flex-1 text-center py-2 border-l border-white/8", closed && "opacity-40")}>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{dow}</p>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-0.5 text-sm font-bold",
                isToday ? "bg-primary text-primary-foreground" : "text-white/80"
              )}>{day}</div>
              {closed && <p className="text-[9px] text-red-400/60 mt-0.5">Cerrado</p>}
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex" style={{ height: totalHeight }}>
          {/* Time gutter */}
          <div className="w-14 flex-shrink-0 relative">
            {hours.map(h => (
              <div key={h} className="absolute right-2 text-[10px] text-muted-foreground/50 font-mono"
                style={{ top: (h - HOUR_START) * PX_PER_HOUR - 7 }}>
                {h === 12 ? "" : `${h}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(ds => {
            const closed = isClosedDay(ds);
            const dayReservations = reservationsByDate[ds] ?? [];

            return (
              <div key={ds} className="flex-1 relative border-l border-white/8">
                {/* Hour lines */}
                {hours.map(h => (
                  <div key={h} className="absolute left-0 right-0 border-t border-white/6"
                    style={{ top: (h - HOUR_START) * PX_PER_HOUR }} />
                ))}

                {/* Half-hour lines */}
                {hours.map(h => (
                  <div key={`${h}h`} className="absolute left-0 right-0 border-t border-white/3"
                    style={{ top: (h - HOUR_START) * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
                ))}

                {/* Service zone shading */}
                {!closed && (
                  <>
                    <div className="absolute left-0 right-0 bg-orange-500/5 pointer-events-none"
                      style={{
                        top: (LUNCH_START - HOUR_START) * PX_PER_HOUR,
                        height: (LUNCH_END - LUNCH_START) * PX_PER_HOUR,
                      }} />
                    <div className="absolute left-0 right-0 bg-indigo-500/5 pointer-events-none"
                      style={{
                        top: (DINNER_START - HOUR_START) * PX_PER_HOUR,
                        height: (DINNER_END - DINNER_START) * PX_PER_HOUR,
                      }} />
                  </>
                )}

                {/* Closed overlay */}
                {closed && (
                  <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />
                )}

                {/* Click to add */}
                {!closed && (
                  <div className="absolute inset-0 cursor-pointer"
                    onClick={e => {
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const totalMinutes = HOUR_START * 60 + Math.floor(y / PX_PER_HOUR * 60);
                      const snapped = Math.round(totalMinutes / 30) * 30;
                      const h = Math.floor(snapped / 60);
                      const m = snapped % 60;
                      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                      onClickSlot(ds, time);
                    }}
                  />
                )}

                {/* Reservation blocks — side-by-side when overlapping */}
                {computeLayout(dayReservations).map(({ r, col, totalCols, startMin, endMin }) => {
                  const top = minutesToPx(startMin);
                  const height = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 28);
                  const cfg = STATUS_COLORS[r.status];
                  const tables = r.assignedTableIds ? JSON.parse(r.assignedTableIds) as string[] : r.tableId ? [r.tableId] : [];

                  // Each block occupies 1/totalCols of the column width with a small gap
                  const GAP = 2; // px gap between parallel blocks
                  const widthPct = 100 / totalCols;
                  const leftPct  = col * widthPct;

                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "absolute rounded-md border-l-2 px-1.5 py-0.5 cursor-pointer z-10 overflow-hidden transition-all hover:brightness-125",
                        cfg.bg, cfg.border, cfg.text,
                        (r.status === "cancelled" || r.status === "no_show" || r.status === "finished") && "opacity-40"
                      )}
                      style={{
                        top,
                        height,
                        left: `calc(${leftPct}% + ${col === 0 ? 2 : GAP}px)`,
                        right: `calc(${100 - leftPct - widthPct}% + ${col === totalCols - 1 ? 2 : GAP}px)`,
                      }}
                      onClick={e => { e.stopPropagation(); onClickReservation(r); }}
                    >
                      <p className="text-[11px] font-semibold leading-tight truncate">{r.guestName}</p>
                      {height > 36 && (
                        <p className="text-[10px] opacity-70 leading-tight">{r.partySize}p{tables.length > 0 ? ` · M${tables.join("+")}` : ""}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReservationsView() {
  const [, setLocation] = useLocation();
  const today = todayStr();

  const [anchorDate, setAnchorDate] = useState(today);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDefaultDate, setAddDefaultDate] = useState(today);
  const [addDefaultTime, setAddDefaultTime] = useState<string | undefined>();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate]);
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  // Fetch week reservations
  const { data: weekReservations = [], refetch } = trpc.reservations.getByDateRange.useQuery(
    { startDate: weekStart, endDate: weekEnd },
    { refetchInterval: 30_000 }
  );

  // Fetch month reservations for mini calendar dots
  const [miniYear, setMiniYear] = useState(() => new Date().getFullYear());
  const [miniMonth, setMiniMonth] = useState(() => new Date().getMonth());
  const monthStart = `${miniYear}-${String(miniMonth + 1).padStart(2, "0")}-01`;
  const lastDayOfMonth = new Date(miniYear, miniMonth + 1, 0).getDate();
  const monthEnd = `${miniYear}-${String(miniMonth + 1).padStart(2, "0")}-${String(lastDayOfMonth).padStart(2, "0")}`;

  const { data: monthReservations = [] } = trpc.reservations.getByDateRange.useQuery(
    { startDate: monthStart, endDate: monthEnd },
    { refetchInterval: 60_000 }
  );

  const reservationsByDate = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    for (const r of weekReservations as Reservation[]) {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    }
    return map;
  }, [weekReservations]);

  const reservationCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of monthReservations as Reservation[]) {
      if (r.status === "cancelled" || r.status === "no_show" || r.status === "finished") continue;
      map[r.date] = (map[r.date] ?? 0) + 1;
    }
    return map;
  }, [monthReservations]);

  const updateStatus = trpc.reservations.updateStatus.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });

  const deleteRes = trpc.reservations.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Reserva eliminada"); },
    onError: (e) => toast.error(e.message),
  });

  const prevWeek = () => {
    const d = new Date(anchorDate + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setAnchorDate(d.toISOString().slice(0, 10));
  };
  const nextWeek = () => {
    const d = new Date(anchorDate + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setAnchorDate(d.toISOString().slice(0, 10));
  };

  const handleClickSlot = (date: string, time: string) => {
    setAddDefaultDate(date);
    setAddDefaultTime(time);
    setShowAddDialog(true);
  };

  const totalWeekReservations = (weekReservations as Reservation[]).filter(
    r => r.status !== "cancelled" && r.status !== "no_show" && r.status !== "finished"
  ).length;

  return (
    <div className="h-screen bg-[#0f0f1a] text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-[#0f0f1a] flex-shrink-0 z-20">
        <button onClick={() => setLocation("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Volver</span>
        </button>

        <div className="flex items-center gap-2 ml-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Reservas</span>
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setAnchorDate(today)}
            className="px-3 py-1 text-xs rounded-lg border border-white/20 hover:bg-white/10 transition-colors font-medium">
            Hoy
          </button>
          <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className="text-sm font-medium text-white/70 ml-1">{formatMonthYear(anchorDate)}</span>

        {totalWeekReservations > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">{totalWeekReservations} esta semana</span>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT sidebar: mini calendar */}
        <div className="w-52 flex-shrink-0 border-r border-white/10 bg-[#0d0d1a] overflow-y-auto py-2">
          <MiniCalendar
            anchorDate={anchorDate}
            onSelectDate={d => setAnchorDate(d)}
            reservationsByDate={reservationCountByDate}
          />

          {/* Legend */}
          <div className="px-3 mt-4 space-y-1.5 border-t border-white/10 pt-3">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-2">Estado</p>
            {(["pending","confirmed","seated","cancelled","finished"] as ReservationStatus[]).map(s => (
              <div key={s} className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", STATUS_COLORS[s].dot)} />
                <span className="text-[11px] text-muted-foreground">{STATUS_LABELS[s]}</span>
              </div>
            ))}
            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2"><span className="w-3 h-2 rounded-sm bg-orange-500/20 flex-shrink-0" /><span className="text-[11px] text-muted-foreground">Comida</span></div>
              <div className="flex items-center gap-2 mt-1"><span className="w-3 h-2 rounded-sm bg-indigo-500/20 flex-shrink-0" /><span className="text-[11px] text-muted-foreground">Cena</span></div>
              <div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-red-400/50">M</span><span className="text-[11px] text-muted-foreground">Martes = cerrado</span></div>
            </div>
          </div>
        </div>

        {/* RIGHT: Week grid */}
        <WeekGrid
          weekDays={weekDays}
          reservationsByDate={reservationsByDate}
          onClickSlot={handleClickSlot}
          onClickReservation={setSelectedReservation}
        />
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => { setAddDefaultDate(anchorDate); setAddDefaultTime(undefined); setShowAddDialog(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
        title="Nueva reserva"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Add Dialog */}
      <AddReservationDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        defaultDate={addDefaultDate}
        defaultTime={addDefaultTime}
        onSuccess={() => refetch()}
      />

      {/* Reservation detail popover */}
      {selectedReservation && (
        <ReservationPopover
          r={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onStatusChange={(id, status) => {
            updateStatus.mutate({ id, status });
            setSelectedReservation(null);
          }}
          onDelete={(id) => {
            deleteRes.mutate({ id });
            setSelectedReservation(null);
          }}
        />
      )}
    </div>
  );
}
