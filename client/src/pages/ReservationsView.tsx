import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Users, Clock, Phone, User,
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trash2
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

const STATUS_CONFIG: Record<ReservationStatus, { label: string; dot: string }> = {
  pending:   { label: "Pendiente",   dot: "bg-yellow-400" },
  confirmed: { label: "Confirmada",  dot: "bg-green-400" },
  seated:    { label: "Sentada",     dot: "bg-blue-400" },
  cancelled: { label: "Cancelada",   dot: "bg-red-400" },
  no_show:   { label: "No apareció", dot: "bg-gray-400" },
  finished:  { label: "Finalizada",   dot: "bg-emerald-700" },
};

const LUNCH_SLOTS  = ["13:00","13:30","14:00","14:30","15:00","15:30"];
const DINNER_BASE  = ["19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00"];
const DINNER_LATE  = [...DINNER_BASE, "23:30"];

function getSlotsForDate(dateStr: string): { lunch: string[]; dinner: string[] } {
  const dow = new Date(dateStr + "T12:00:00").getDay();
  if (dow === 2) return { lunch: [], dinner: [] }; // martes cerrado
  const dinner = (dow === 5 || dow === 6) ? DINNER_LATE : DINNER_BASE;
  return { lunch: LUNCH_SLOTS, dinner };
}

function isOpen(dateStr: string): boolean {
  const dow = new Date(dateStr + "T12:00:00").getDay();
  return dow !== 2;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    days.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Reservation Card ─────────────────────────────────────────────────────────

function ReservationCard({
  r,
  onStatusChange,
  onDelete,
}: {
  r: Reservation;
  onStatusChange: (id: number, status: ReservationStatus) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = STATUS_CONFIG[r.status];
  const tables = r.assignedTableIds ? JSON.parse(r.assignedTableIds) as string[] : r.tableId ? [r.tableId] : [];

  return (
    <div className={cn(
      "rounded-xl border p-3 flex flex-col gap-2 transition-all",
      r.status === "cancelled" || r.status === "no_show" || r.status === "finished"
        ? "opacity-40 border-white/10 bg-white/5"
        : "border-white/15 bg-white/8 hover:bg-white/12"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", cfg.dot)} />
          <span className="font-semibold text-sm truncate">{r.guestName}</span>
          {r.origin === "web" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-400 border-blue-400/50 flex-shrink-0">Web</Badge>
          )}
        </div>
        <button
          onClick={() => onDelete(r.id)}
          className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}{r.estimatedEnd ? `–${r.estimatedEnd}` : ""}</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.partySize} pax</span>
        {r.guestPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.guestPhone}</span>}
        {tables.length > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            Mesa {tables.join("+")}
          </span>
        )}
      </div>

      {r.assignmentInstruction && (
        <p className="text-[11px] text-amber-300/80 bg-amber-400/10 rounded px-2 py-1">{r.assignmentInstruction}</p>
      )}

      {r.notes && (
        <p className="text-[11px] text-muted-foreground italic">"{r.notes}"</p>
      )}

      {/* Status actions */}
      {r.status !== "cancelled" && r.status !== "no_show" && r.status !== "finished" && (
        <div className="flex gap-1.5 flex-wrap mt-0.5">
          {r.status === "pending" && (
            <button
              onClick={() => onStatusChange(r.id, "confirmed")}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <CheckCircle2 className="w-3 h-3" /> Confirmar
            </button>
          )}
          {(r.status === "pending" || r.status === "confirmed") && (
            <button
              onClick={() => onStatusChange(r.id, "seated")}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <User className="w-3 h-3" /> Sentado
            </button>
          )}
          <button
            onClick={() => onStatusChange(r.id, "cancelled")}
            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
          >
            <XCircle className="w-3 h-3" /> Cancelar
          </button>
        </div>
      )}
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

  const slots = getSlotsForDate(form.date);
  const allSlots = [...slots.lunch, ...slots.dinner];

  const createMut = trpc.reservations.create.useMutation({
    onSuccess: () => {
      toast.success("Reserva añadida");
      onSuccess();
      onClose();
      setForm({ guestName: "", guestPhone: "", date: defaultDate, time: defaultTime ?? "", partySize: "2", notes: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.guestName.trim()) return toast.error("Nombre obligatorio");
    if (!form.date) return toast.error("Fecha obligatoria");
    if (!form.time) return toast.error("Hora obligatoria");
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
        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Nombre *</Label>
            <Input
              value={form.guestName}
              onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
              placeholder="Nombre del cliente"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Teléfono</Label>
            <Input
              value={form.guestPhone}
              onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))}
              placeholder="612 345 678"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Fecha *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value, time: "" }))}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Personas *</Label>
              <Select value={form.partySize} onValueChange={v => setForm(f => ({ ...f, partySize: v }))}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
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
            {allSlots.length === 0 ? (
              <p className="text-sm text-red-400">Martes — restaurante cerrado</p>
            ) : (
              <div className="space-y-2">
                {slots.lunch.length > 0 && (
                  <div>
                    <p className="text-[10px] text-orange-400 uppercase tracking-wider mb-1">🌞 Comida</p>
                    <div className="flex flex-wrap gap-1.5">
                      {slots.lunch.map(s => (
                        <button
                          key={s}
                          onClick={() => setForm(f => ({ ...f, time: s }))}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                            form.time === s
                              ? "bg-orange-500 text-white"
                              : "bg-white/8 text-muted-foreground hover:bg-white/15"
                          )}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}
                {slots.dinner.length > 0 && (
                  <div>
                    <p className="text-[10px] text-indigo-400 uppercase tracking-wider mb-1">🌙 Cena</p>
                    <div className="flex flex-wrap gap-1.5">
                      {slots.dinner.map(s => (
                        <button
                          key={s}
                          onClick={() => setForm(f => ({ ...f, time: s }))}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                            form.time === s
                              ? "bg-indigo-500 text-white"
                              : "bg-white/8 text-muted-foreground hover:bg-white/15"
                          )}
                        >{s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Notas</Label>
            <Input
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Alergias, ocasión especial..."
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={createMut.isPending}
            className="bg-primary text-primary-foreground"
          >
            {createMut.isPending ? "Guardando..." : "Añadir Reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({
  dateStr,
  reservations,
  onStatusChange,
  onDelete,
  onAddWithTime,
}: {
  dateStr: string;
  reservations: Reservation[];
  onStatusChange: (id: number, status: ReservationStatus) => void;
  onDelete: (id: number) => void;
  onAddWithTime: (time: string) => void;
}) {
  const slots = getSlotsForDate(dateStr);
  const closed = !isOpen(dateStr);

  const getReservationsForSlot = (time: string) =>
    reservations.filter(r => r.time === time && r.status !== "cancelled" && r.status !== "no_show" && r.status !== "finished");

  const allForDay = reservations.filter(r => r.status !== "cancelled" && r.status !== "no_show" && r.status !== "finished");
  const lunchReservations = allForDay.filter(r => LUNCH_SLOTS.includes(r.time));
  const dinnerReservations = allForDay.filter(r => [...DINNER_BASE, "23:30"].includes(r.time));

  if (closed) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <span className="text-4xl">🔒</span>
        <p className="text-sm font-medium">Cerrado los martes</p>
      </div>
    );
  }

  const renderSlotGroup = (slotList: string[], label: string, color: string, accent: string) => {
    const hasAny = slotList.some(s => getReservationsForSlot(s).length > 0);
    return (
      <div className="flex-1 min-w-0">
        {/* Service header */}
        <div className={cn("rounded-xl px-4 py-3 mb-3 flex items-center justify-between", color)}>
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs opacity-70">{slotList[0]} – {slotList[slotList.length - 1]}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{label === "🌞 Comida" ? lunchReservations.length : dinnerReservations.length}</p>
            <p className="text-xs opacity-70">reservas</p>
          </div>
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {slotList.map(slot => {
            const rsvs = getReservationsForSlot(slot);
            return (
              <div key={slot} className="flex gap-2">
                {/* Time label */}
                <div className="w-12 flex-shrink-0 flex items-start justify-end pt-1">
                  <span className={cn("text-xs font-mono font-medium", rsvs.length > 0 ? accent : "text-muted-foreground/50")}>{slot}</span>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {rsvs.length === 0 ? (
                    <button
                      onClick={() => onAddWithTime(slot)}
                      className="w-full h-8 rounded-lg border border-dashed border-white/10 hover:border-white/25 hover:bg-white/5 transition-all flex items-center justify-center group"
                    >
                      <Plus className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground/60" />
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      {rsvs.map(r => (
                        <ReservationCard
                          key={r.id}
                          r={r}
                          onStatusChange={onStatusChange}
                          onDelete={onDelete}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!hasAny && (
          <p className="text-center text-xs text-muted-foreground/40 mt-4">Sin reservas</p>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-4 h-full">
      {renderSlotGroup(slots.lunch, "🌞 Comida", "bg-orange-500/15 border border-orange-500/30 text-orange-200", "text-orange-400")}
      <div className="w-px bg-white/10 flex-shrink-0" />
      {renderSlotGroup(slots.dinner, "🌙 Cena", "bg-indigo-500/15 border border-indigo-500/30 text-indigo-200", "text-indigo-400")}
    </div>
  );
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

function MonthCalendar({
  year,
  month,
  selectedDate,
  reservationsByDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  selectedDate: string;
  reservationsByDate: Record<string, number>;
  onSelectDate: (d: string) => void;
}) {
  const days = getDaysInMonth(year, month);
  const today = todayStr();

  // Pad to start on Monday
  const firstDow = (days[0].getDay() + 6) % 7; // 0=Mon
  const padded: (Date | null)[] = [...Array(firstDow).fill(null), ...days];

  const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DOW_LABELS = ["L","M","X","J","V","S","D"];

  return (
    <div className="w-full">
      {/* DOW headers */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map((d, i) => (
          <div key={i} className={cn("text-center text-[11px] font-medium py-1", i === 1 ? "text-red-400/60" : "text-muted-foreground/60")}>{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {padded.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = toDateStr(d);
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const isClosed = d.getDay() === 2; // martes
          const count = reservationsByDate[ds] ?? 0;

          return (
            <button
              key={ds}
              onClick={() => onSelectDate(ds)}
              disabled={isClosed}
              className={cn(
                "relative rounded-lg py-2 flex flex-col items-center justify-center transition-all text-sm font-medium",
                isClosed && "opacity-25 cursor-not-allowed",
                isSelected && !isClosed && "bg-primary text-primary-foreground shadow-lg",
                isToday && !isSelected && "ring-1 ring-primary/60",
                !isSelected && !isClosed && "hover:bg-white/10 text-foreground",
              )}
            >
              <span>{d.getDate()}</span>
              {count > 0 && !isClosed && (
                <span className={cn(
                  "absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center",
                  isSelected ? "bg-white/30 text-white" : "bg-primary/80 text-white"
                )}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReservationsView() {
  const [, setLocation] = useLocation();
  const today = todayStr();

  const [selectedDate, setSelectedDate] = useState(today);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDefaultTime, setAddDefaultTime] = useState<string | undefined>();

  // Fetch reservations for selected date
  const { data: dayReservations = [], refetch: refetchDay } = trpc.reservations.getByDate.useQuery(
    { date: selectedDate },
    { refetchInterval: 30_000 }
  );

  // Fetch reservations for the whole month (for calendar dots)
  const monthStart = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
  const monthEnd = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: monthReservations = [], refetch: refetchMonth } = trpc.reservations.getByDateRange.useQuery(
    { startDate: monthStart, endDate: monthEnd },
    { refetchInterval: 60_000 }
  );

  const reservationsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of monthReservations) {
      if (r.status === "cancelled" || r.status === "no_show") continue;
      map[r.date] = (map[r.date] ?? 0) + 1;
    }
    return map;
  }, [monthReservations]);

  const updateStatus = trpc.reservations.updateStatus.useMutation({
    onSuccess: () => { refetchDay(); refetchMonth(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteRes = trpc.reservations.delete.useMutation({
    onSuccess: () => { refetchDay(); refetchMonth(); toast.success("Reserva eliminada"); },
    onError: (e) => toast.error(e.message),
  });

  const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const handleAddWithTime = (time: string) => {
    setAddDefaultTime(time);
    setShowAddDialog(true);
  };

  const activeCount = (dayReservations as Reservation[]).filter(r => r.status !== "cancelled" && r.status !== "no_show").length;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/30 flex-shrink-0">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Volver</span>
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base">Reservas</h1>
        </div>
      </div>

      {/* Main layout: calendar left + day view right */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Month calendar */}
        <div className="w-64 flex-shrink-0 border-r border-white/10 bg-black/20 flex flex-col p-4 gap-4 overflow-y-auto">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold">{MONTH_NAMES[calMonth]} {calYear}</span>
            <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <MonthCalendar
            year={calYear}
            month={calMonth}
            selectedDate={selectedDate}
            reservationsByDate={reservationsByDate}
            onSelectDate={setSelectedDate}
          />

          {/* Legend */}
          <div className="space-y-1 text-[11px] text-muted-foreground border-t border-white/10 pt-3">
            <p className="font-medium text-white/60 mb-2">Leyenda</p>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Pendiente</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400" /> Confirmada</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400" /> Sentada</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400" /> Cancelada</div>
            <div className="flex items-center gap-2 opacity-40"><span className="text-xs">M</span> Martes = cerrado</div>
          </div>
        </div>

        {/* RIGHT: Day view */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Day header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
            <div>
              <h2 className="font-semibold capitalize">{formatShortDate(selectedDate)}</h2>
              <p className="text-xs text-muted-foreground">
                {activeCount > 0 ? `${activeCount} reserva${activeCount !== 1 ? "s" : ""}` : "Sin reservas"}
                {!isOpen(selectedDate) && " · Cerrado"}
              </p>
            </div>
          </div>

          {/* Scrollable day content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <DayView
              dateStr={selectedDate}
              reservations={dayReservations as Reservation[]}
              onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
              onDelete={(id) => deleteRes.mutate({ id })}
              onAddWithTime={handleAddWithTime}
            />
          </div>
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => { setAddDefaultTime(undefined); setShowAddDialog(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
        title="Nueva reserva"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </button>

      {/* Add Dialog */}
      <AddReservationDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        defaultDate={selectedDate}
        defaultTime={addDefaultTime}
        onSuccess={() => { refetchDay(); refetchMonth(); }}
      />
    </div>
  );
}
