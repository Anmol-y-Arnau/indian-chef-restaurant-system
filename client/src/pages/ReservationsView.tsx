import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  Users,
  Phone,
  Utensils,
  X,
  Edit2,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  addWeeks,
  subWeeks,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReservationStatus = "pending" | "confirmed" | "seated" | "cancelled" | "no_show";

interface Reservation {
  id: number;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  date: string;
  time: string;
  partySize: number;
  tableId?: string | null;
  status: ReservationStatus;
  notes?: string | null;
  origin: "manual" | "web" | "phone";
  createdAt: Date;
  updatedAt: Date;
}

// ─── Restaurant layout ────────────────────────────────────────────────────────
// Mesas del restaurante: 0+, 0-, 1-10 + TAKEAWAY
// Layout visual aproximado del local (posiciones en grid 6x5)
const RESTAURANT_TABLES = [
  // Mesas especiales (barra/terraza)
  { id: "0+",  label: "0+",  x: 0, y: 0, w: 1, h: 1, type: "special" },
  { id: "0-",  label: "0-",  x: 1, y: 0, w: 1, h: 1, type: "special" },
  // Mesas del comedor principal (2 filas de 5)
  { id: "1",   label: "1",   x: 0, y: 2, w: 1, h: 1, type: "table" },
  { id: "2",   label: "2",   x: 1, y: 2, w: 1, h: 1, type: "table" },
  { id: "3",   label: "3",   x: 2, y: 2, w: 1, h: 1, type: "table" },
  { id: "4",   label: "4",   x: 3, y: 2, w: 1, h: 1, type: "table" },
  { id: "5",   label: "5",   x: 4, y: 2, w: 1, h: 1, type: "table" },
  { id: "6",   label: "6",   x: 0, y: 4, w: 1, h: 1, type: "table" },
  { id: "7",   label: "7",   x: 1, y: 4, w: 1, h: 1, type: "table" },
  { id: "8",   label: "8",   x: 2, y: 4, w: 1, h: 1, type: "table" },
  { id: "9",   label: "9",   x: 3, y: 4, w: 1, h: 1, type: "table" },
  { id: "10",  label: "10",  x: 4, y: 4, w: 1, h: 1, type: "table" },
];

// ─── Opening hours ────────────────────────────────────────────────────────────
// Wed–Mon: 13:00–16:00 and 19:00–23:00
// Fri–Sat: 19:00–23:30
// Tue: CLOSED

function getTimeSlotsForDate(date: Date): string[] {
  const dow = getDay(date); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  if (dow === 2) return []; // Tuesday = closed

  const lunch = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
  const dinnerBase = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];
  const dinnerLate = [...dinnerBase, "23:30"]; // Fri & Sat

  const dinner = (dow === 5 || dow === 6) ? dinnerLate : dinnerBase;
  return [...lunch, ...dinner];
}

function isRestaurantOpen(date: Date): boolean {
  return getDay(date) !== 2; // Not Tuesday
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pendiente",   color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",  icon: <AlertCircle className="w-3 h-3" /> },
  confirmed: { label: "Confirmada",  color: "bg-green-500/20 text-green-400 border-green-500/30",     icon: <CheckCircle className="w-3 h-3" /> },
  seated:    { label: "Sentada",     color: "bg-blue-500/20 text-blue-400 border-blue-500/30",        icon: <UserCheck className="w-3 h-3" /> },
  cancelled: { label: "Cancelada",   color: "bg-red-500/20 text-red-400 border-red-500/30",           icon: <XCircle className="w-3 h-3" /> },
  no_show:   { label: "No apareció", color: "bg-gray-500/20 text-gray-400 border-gray-500/30",        icon: <XCircle className="w-3 h-3" /> },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReservationsView() {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formTime, setFormTime] = useState("20:00");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPartySize, setFormPartySize] = useState(2);
  const [formTableId, setFormTableId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState<ReservationStatus>("confirmed");

  // ── Date range ──
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const startDate = format(viewMode === "week" ? weekStart : currentDate, "yyyy-MM-dd");
  const endDate = format(viewMode === "week" ? weekEnd : currentDate, "yyyy-MM-dd");

  // ── Data ──
  const { data: reservations = [], refetch } = trpc.reservations.getByDateRange.useQuery(
    { startDate, endDate },
    { refetchInterval: 30_000 }
  );

  // ── Mutations ──
  const createMutation = trpc.reservations.create.useMutation({
    onSuccess: () => { toast.success("Reserva creada"); refetch(); setIsFormOpen(false); resetForm(); },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const updateMutation = trpc.reservations.update.useMutation({
    onSuccess: (updated) => {
      toast.success("Reserva actualizada"); refetch(); setIsFormOpen(false); setEditingReservation(null);
      if (updated) setSelectedReservation(updated as Reservation);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const statusMutation = trpc.reservations.updateStatus.useMutation({
    onSuccess: (updated) => {
      toast.success("Estado actualizado"); refetch();
      if (updated) setSelectedReservation(updated as Reservation);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const deleteMutation = trpc.reservations.delete.useMutation({
    onSuccess: () => { toast.success("Reserva eliminada"); refetch(); setSelectedReservation(null); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // ── Helpers ──
  const resetForm = () => {
    setFormName(""); setFormPhone(""); setFormPartySize(2);
    setFormTableId(""); setFormNotes(""); setFormStatus("confirmed");
    setFormDate(format(new Date(), "yyyy-MM-dd")); setFormTime("20:00");
  };

  const openNewForm = (date?: Date) => {
    setEditingReservation(null);
    resetForm();
    if (date) setFormDate(format(date, "yyyy-MM-dd"));
    setIsFormOpen(true);
  };

  const openEditForm = (r: Reservation) => {
    setEditingReservation(r);
    setFormName(r.guestName); setFormPhone(r.guestPhone);
    setFormPartySize(r.partySize); setFormTableId(r.tableId ?? "");
    setFormNotes(r.notes ?? ""); setFormStatus(r.status);
    setFormDate(r.date); setFormTime(r.time);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formPhone.trim()) {
      toast.error("Nombre y teléfono son obligatorios");
      return;
    }
    const payload = {
      guestName: formName.trim(),
      guestPhone: formPhone.trim(),
      guestEmail: null,
      date: formDate,
      time: formTime,
      partySize: formPartySize,
      tableId: formTableId || null,
      status: formStatus,
      notes: formNotes || null,
      origin: "manual" as const,
    };
    if (editingReservation) {
      updateMutation.mutate({ id: editingReservation.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Stats ──
  const stats = useMemo(() => {
    const all = reservations as Reservation[];
    return {
      total: all.length,
      confirmed: all.filter(r => r.status === "confirmed").length,
      pending: all.filter(r => r.status === "pending").length,
      covers: all.filter(r => ["confirmed", "seated"].includes(r.status)).reduce((s, r) => s + r.partySize, 0),
    };
  }, [reservations]);

  // ── Table occupancy for selected day (day view) ──
  const dayReservations = (reservations as Reservation[]).filter(
    r => r.date === format(currentDate, "yyyy-MM-dd")
  );
  const occupiedTableIds = new Set(
    dayReservations
      .filter(r => ["confirmed", "seated", "pending"].includes(r.status) && r.tableId)
      .map(r => r.tableId!)
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h1 className="font-bold text-lg">Reservas</h1>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 ml-1 flex-wrap">
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{stats.total} reservas</span>
          {stats.confirmed > 0 && <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">{stats.confirmed} confirmadas</span>}
          {stats.pending > 0 && <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">{stats.pending} pendientes</span>}
          {stats.covers > 0 && <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">{stats.covers} comensales</span>}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setViewMode("week")} className={cn("px-3 py-1.5 text-xs font-medium transition-colors", viewMode === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>Semana</button>
            <button onClick={() => setViewMode("day")} className={cn("px-3 py-1.5 text-xs font-medium transition-colors", viewMode === "day" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>Día</button>
          </div>
          {/* Navigation */}
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-full"
            onClick={() => setCurrentDate(d => viewMode === "week" ? subWeeks(d, 1) : subDays(d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button onClick={() => setCurrentDate(new Date())}
            className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-muted transition-colors min-w-[130px] text-center">
            {viewMode === "week"
              ? `${format(weekStart, "d MMM", { locale: es })} – ${format(weekEnd, "d MMM", { locale: es })}`
              : format(currentDate, "EEE d MMM", { locale: es })}
          </button>
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-full"
            onClick={() => setCurrentDate(d => viewMode === "week" ? addWeeks(d, 1) : addDays(d, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button onClick={() => openNewForm(viewMode === "day" ? currentDate : undefined)} className="gap-1.5 rounded-full px-4">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva</span>
          </Button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          {viewMode === "week" ? (
            <WeekView
              days={weekDays}
              reservations={reservations as Reservation[]}
              onSelectReservation={(r) => { setSelectedReservation(r); setCurrentDate(new Date(r.date + "T12:00:00")); }}
              onAddReservation={openNewForm}
              selectedId={selectedReservation?.id}
            />
          ) : (
            <DayView
              date={currentDate}
              reservations={dayReservations}
              occupiedTableIds={occupiedTableIds}
              onSelectReservation={setSelectedReservation}
              onAddReservation={() => openNewForm(currentDate)}
              selectedId={selectedReservation?.id}
            />
          )}
        </div>

        {/* ── Detail Panel ── */}
        {selectedReservation && (
          <DetailPanel
            reservation={selectedReservation}
            onClose={() => setSelectedReservation(null)}
            onEdit={() => openEditForm(selectedReservation)}
            onDelete={() => { if (confirm("¿Eliminar esta reserva?")) deleteMutation.mutate({ id: selectedReservation.id }); }}
            onStatusChange={(status) => statusMutation.mutate({ id: selectedReservation.id, status })}
          />
        )}
      </div>

      {/* ── Form Dialog ── */}
      <ReservationFormDialog
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingReservation(null); }}
        formName={formName} setFormName={setFormName}
        formPhone={formPhone} setFormPhone={setFormPhone}
        formPartySize={formPartySize} setFormPartySize={setFormPartySize}
        formDate={formDate} setFormDate={setFormDate}
        formTime={formTime} setFormTime={setFormTime}
        formTableId={formTableId} setFormTableId={setFormTableId}
        formNotes={formNotes} setFormNotes={setFormNotes}
        formStatus={formStatus} setFormStatus={setFormStatus}
        onSubmit={handleSubmit}
        isEditing={!!editingReservation}
        isLoading={createMutation.isPending || updateMutation.isPending}
        existingReservations={reservations as Reservation[]}
      />
    </div>
  );
}

// ─── Week View ────────────────────────────────────────────────────────────────

function WeekView({ days, reservations, onSelectReservation, onAddReservation, selectedId }: {
  days: Date[];
  reservations: Reservation[];
  onSelectReservation: (r: Reservation) => void;
  onAddReservation: (date: Date) => void;
  selectedId?: number;
}) {
  const today = new Date();
  return (
    <div className="grid grid-cols-7 h-full min-h-[500px]">
      {days.map(day => {
        const dayRes = reservations.filter(r => r.date === format(day, "yyyy-MM-dd"));
        const isToday = isSameDay(day, today);
        const closed = !isRestaurantOpen(day);
        return (
          <div key={day.toISOString()} className={cn(
            "border-r border-border last:border-r-0 flex flex-col min-h-full",
            isToday && "bg-primary/5",
            closed && "bg-muted/30"
          )}>
            {/* Day header */}
            <div className={cn(
              "sticky top-0 z-10 px-2 py-2 border-b border-border text-center bg-card",
              isToday && "bg-primary/10",
              closed && "bg-muted/50"
            )}>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                {format(day, "EEE", { locale: es })}
              </div>
              <div className={cn(
                "text-lg font-bold mt-0.5 w-8 h-8 rounded-full flex items-center justify-center mx-auto",
                isToday ? "bg-primary text-primary-foreground" : ""
              )}>
                {format(day, "d")}
              </div>
              {closed ? (
                <div className="text-xs text-muted-foreground mt-1">Cerrado</div>
              ) : dayRes.length > 0 ? (
                <div className="text-xs text-cyan-400 mt-1">{dayRes.length} res.</div>
              ) : null}
            </div>

            {/* Reservations */}
            <ScrollArea className="flex-1">
              <div className="p-1.5 flex flex-col gap-1.5 pb-12">
                {closed ? (
                  <div className="text-center py-4 text-xs text-muted-foreground/50">Martes<br/>cerrado</div>
                ) : (
                  dayRes.sort((a, b) => a.time.localeCompare(b.time)).map(r => (
                    <ReservationCard key={r.id} reservation={r} compact selected={r.id === selectedId} onClick={() => onSelectReservation(r)} />
                  ))
                )}
              </div>
            </ScrollArea>

            {!closed && (
              <button onClick={() => onAddReservation(day)}
                className="shrink-0 m-1.5 p-1.5 rounded-lg border border-dashed border-border hover:border-cyan-400 hover:bg-cyan-500/5 transition-colors text-muted-foreground hover:text-cyan-400 flex items-center justify-center gap-1 text-xs">
                <Plus className="w-3 h-3" />
                <span className="hidden lg:inline">Añadir</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({ date, reservations, occupiedTableIds, onSelectReservation, onAddReservation, selectedId }: {
  date: Date;
  reservations: Reservation[];
  occupiedTableIds: Set<string>;
  onSelectReservation: (r: Reservation) => void;
  onAddReservation: () => void;
  selectedId?: number;
}) {
  const closed = !isRestaurantOpen(date);
  const slots = getTimeSlotsForDate(date);
  const lunchSlots = slots.filter(t => t < "17:00");
  const dinnerSlots = slots.filter(t => t >= "17:00");

  // Group reservations by time slot
  const bySlot: Record<string, Reservation[]> = {};
  for (const r of reservations) {
    if (!bySlot[r.time]) bySlot[r.time] = [];
    bySlot[r.time].push(r);
  }

  return (
    <div className="flex gap-4 p-4 h-full overflow-auto">
      {/* ── Left: Timeline ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold capitalize">
            {format(date, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
          {!closed && (
            <Button onClick={onAddReservation} size="sm" className="gap-1.5 rounded-full">
              <Plus className="w-4 h-4" /> Nueva reserva
            </Button>
          )}
        </div>

        {closed ? (
          <div className="text-center py-16 text-muted-foreground">
            <div className="text-4xl mb-3">🔒</div>
            <p className="font-medium">Cerrado los martes</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Lunch */}
            {lunchSlots.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="text-base">☀️</span> Mediodía (13:00 – 16:00)
                </div>
                <div className="flex flex-col gap-1.5">
                  {lunchSlots.map(slot => (
                    <TimeSlotRow key={slot} slot={slot} reservations={bySlot[slot] || []}
                      onSelect={onSelectReservation} selectedId={selectedId} />
                  ))}
                </div>
              </div>
            )}
            {/* Dinner */}
            {dinnerSlots.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="text-base">🌙</span> Noche (19:00 – {dinnerSlots[dinnerSlots.length - 1]})
                </div>
                <div className="flex flex-col gap-1.5">
                  {dinnerSlots.map(slot => (
                    <TimeSlotRow key={slot} slot={slot} reservations={bySlot[slot] || []}
                      onSelect={onSelectReservation} selectedId={selectedId} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Right: Table map ── */}
      <div className="w-64 shrink-0">
        <div className="sticky top-0">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Mapa de mesas
          </div>
          <TableMap occupiedTableIds={occupiedTableIds} reservations={reservations} />
          <div className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50 inline-block" /> Libre</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50 inline-block" /> Con reserva</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-muted border border-border inline-block" /> Sin asignar</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Time Slot Row ────────────────────────────────────────────────────────────

function TimeSlotRow({ slot, reservations, onSelect, selectedId }: {
  slot: string;
  reservations: Reservation[];
  onSelect: (r: Reservation) => void;
  selectedId?: number;
}) {
  const totalCovers = reservations
    .filter(r => !["cancelled", "no_show"].includes(r.status))
    .reduce((s, r) => s + r.partySize, 0);

  return (
    <div className="flex gap-2 items-start">
      <div className="w-14 shrink-0 text-right">
        <span className="text-sm font-mono text-muted-foreground">{slot}</span>
        {totalCovers > 0 && (
          <div className="text-xs text-cyan-400">{totalCovers} pax</div>
        )}
      </div>
      <div className="flex-1 min-h-[2.5rem] border-l-2 border-border pl-3 flex flex-col gap-1">
        {reservations.length === 0 ? (
          <div className="h-8 rounded border border-dashed border-border/50" />
        ) : (
          reservations.map(r => (
            <ReservationCard key={r.id} reservation={r} compact selected={r.id === selectedId} onClick={() => onSelect(r)} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Table Map ────────────────────────────────────────────────────────────────

function TableMap({ occupiedTableIds, reservations }: {
  occupiedTableIds: Set<string>;
  reservations: Reservation[];
}) {
  // Build a map of tableId -> reservation for tooltip
  const tableReservations: Record<string, Reservation[]> = {};
  for (const r of reservations) {
    if (r.tableId && !["cancelled", "no_show"].includes(r.status)) {
      if (!tableReservations[r.tableId]) tableReservations[r.tableId] = [];
      tableReservations[r.tableId].push(r);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-3">
      {/* Special tables row */}
      <div className="text-xs text-muted-foreground mb-2">Terraza / Barra</div>
      <div className="flex gap-2 mb-4">
        {RESTAURANT_TABLES.filter(t => t.type === "special").map(table => {
          const occupied = occupiedTableIds.has(table.id);
          const res = tableReservations[table.id] || [];
          return (
            <div key={table.id} title={res.map(r => `${r.time} ${r.guestName} (${r.partySize})`).join("\n")}
              className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-colors",
                occupied
                  ? "bg-yellow-500/20 border-yellow-500/60 text-yellow-300"
                  : "bg-green-500/10 border-green-500/40 text-green-400"
              )}>
              {table.label}
              {res.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-[10px] text-black font-bold flex items-center justify-center">
                  {res.length}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main tables grid 2x5 */}
      <div className="text-xs text-muted-foreground mb-2">Comedor</div>
      <div className="grid grid-cols-5 gap-2">
        {RESTAURANT_TABLES.filter(t => t.type === "table").map(table => {
          const occupied = occupiedTableIds.has(table.id);
          const res = tableReservations[table.id] || [];
          return (
            <div key={table.id}
              title={res.map(r => `${r.time} ${r.guestName} (${r.partySize} pax)`).join("\n") || `Mesa ${table.label} libre`}
              className={cn(
                "relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-bold border-2 transition-colors cursor-default",
                occupied
                  ? "bg-yellow-500/20 border-yellow-500/60 text-yellow-300"
                  : "bg-green-500/10 border-green-500/40 text-green-400"
              )}>
              {table.label}
              {res.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full text-[10px] text-black font-bold flex items-center justify-center">
                  {res.length}
                </div>
              )}
              {res.length > 0 && (
                <div className="text-[9px] text-yellow-400 mt-0.5">
                  {res.reduce((s, r) => s + r.partySize, 0)} pax
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reservation Card ─────────────────────────────────────────────────────────

function ReservationCard({ reservation: r, compact, selected, onClick }: {
  reservation: Reservation;
  compact?: boolean;
  selected?: boolean;
  onClick: () => void;
}) {
  const status = STATUS_CONFIG[r.status];
  return (
    <button onClick={onClick} className={cn(
      "w-full text-left rounded-lg border p-2 transition-all hover:scale-[1.02] active:scale-100",
      selected ? "border-cyan-400 bg-cyan-500/10 shadow-md" : "border-border bg-card hover:border-cyan-400/50",
      r.status === "cancelled" && "opacity-50"
    )}>
      <div className="flex items-start gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{r.guestName}</div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
            {!compact && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}</span>}
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.partySize} pax</span>
            {r.tableId && <span className="flex items-center gap-1"><Utensils className="w-3 h-3" />M.{r.tableId}</span>}
          </div>
          <div className={cn("mt-1 text-xs px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 w-fit", status.color)}>
            {status.icon}{status.label}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({ reservation: r, onClose, onEdit, onDelete, onStatusChange }: {
  reservation: Reservation;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: ReservationStatus) => void;
}) {
  const status = STATUS_CONFIG[r.status];
  return (
    <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-bold">Detalle</h3>
        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-4">
          <div>
            <div className="text-lg font-bold">{r.guestName}</div>
            <a href={`tel:${r.guestPhone}`} className="flex items-center gap-1.5 text-sm text-cyan-400 hover:underline mt-1">
              <Phone className="w-3.5 h-3.5" />{r.guestPhone}
            </a>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="capitalize font-medium">{format(new Date(r.date + "T12:00:00"), "EEEE d 'de' MMMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-base">{r.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">{r.partySize} {r.partySize === 1 ? "comensal" : "comensales"}</span>
            </div>
            {r.tableId && (
              <div className="flex items-center gap-2 text-sm">
                <Utensils className="w-4 h-4 text-cyan-400" />
                <span>Mesa {r.tableId}</span>
              </div>
            )}
          </div>
          {/* Status buttons */}
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Estado</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(STATUS_CONFIG) as [ReservationStatus, typeof STATUS_CONFIG[ReservationStatus]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => onStatusChange(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    r.status === key ? cfg.color + " scale-105 shadow-sm" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}>
                  {cfg.icon}{cfg.label}
                </button>
              ))}
            </div>
          </div>
          {r.notes && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Notas</div>
              <p className="text-sm bg-muted/50 rounded-lg p-2">{r.notes}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Origen: {r.origin === "web" ? "Web" : r.origin === "phone" ? "Teléfono" : "Manual"}
          </div>
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-border flex gap-2">
        <Button variant="outline" className="flex-1 gap-1.5 rounded-lg" onClick={onEdit}>
          <Edit2 className="w-4 h-4" /> Editar
        </Button>
        <Button variant="outline" className="gap-1.5 rounded-lg text-red-400 hover:text-red-400 hover:bg-red-500/10 border-red-500/30" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────

function ReservationFormDialog({
  open, onClose, formName, setFormName, formPhone, setFormPhone,
  formPartySize, setFormPartySize, formDate, setFormDate, formTime, setFormTime,
  formTableId, setFormTableId, formNotes, setFormNotes, formStatus, setFormStatus,
  onSubmit, isEditing, isLoading, existingReservations,
}: {
  open: boolean; onClose: () => void;
  formName: string; setFormName: (v: string) => void;
  formPhone: string; setFormPhone: (v: string) => void;
  formPartySize: number; setFormPartySize: (v: number) => void;
  formDate: string; setFormDate: (v: string) => void;
  formTime: string; setFormTime: (v: string) => void;
  formTableId: string; setFormTableId: (v: string) => void;
  formNotes: string; setFormNotes: (v: string) => void;
  formStatus: ReservationStatus; setFormStatus: (v: ReservationStatus) => void;
  onSubmit: () => void; isEditing: boolean; isLoading: boolean;
  existingReservations: Reservation[];
}) {
  const selectedDate = formDate ? new Date(formDate + "T12:00:00") : new Date();
  const slots = getTimeSlotsForDate(selectedDate);
  const closed = !isRestaurantOpen(selectedDate);

  // Which tables are already taken at the selected time
  const takenTableIds = new Set(
    existingReservations
      .filter(r => r.date === formDate && r.time === formTime && !["cancelled", "no_show"].includes(r.status))
      .map(r => r.tableId!)
      .filter(Boolean)
  );

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar reserva" : "Nueva reserva"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guestName">Nombre *</Label>
            <Input id="guestName" placeholder="Nombre del cliente" value={formName} onChange={e => setFormName(e.target.value)} autoFocus />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guestPhone">Teléfono *</Label>
            <Input id="guestPhone" type="tel" placeholder="+34 600 000 000" value={formPhone} onChange={e => setFormPhone(e.target.value)} />
          </div>

          {/* Party size */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="partySize">Número de personas *</Label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setFormPartySize(Math.max(1, formPartySize - 1))}
                className="w-10 h-10 rounded-full border border-border hover:bg-muted flex items-center justify-center text-lg font-bold transition-colors">−</button>
              <span className="text-2xl font-bold w-12 text-center">{formPartySize}</span>
              <button type="button" onClick={() => setFormPartySize(Math.min(50, formPartySize + 1))}
                className="w-10 h-10 rounded-full border border-border hover:bg-muted flex items-center justify-center text-lg font-bold transition-colors">+</button>
              <span className="text-sm text-muted-foreground">{formPartySize === 1 ? "persona" : "personas"}</span>
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Fecha *</Label>
            <Input id="date" type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
            {closed && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> El restaurante está cerrado los martes
              </p>
            )}
          </div>

          {/* Time slots */}
          {!closed && (
            <div className="flex flex-col gap-1.5">
              <Label>Hora *</Label>
              {slots.length === 0 ? (
                <p className="text-xs text-muted-foreground">No hay horarios disponibles para este día</p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {slots.map(slot => (
                    <button key={slot} type="button" onClick={() => setFormTime(slot)}
                      className={cn(
                        "py-2 rounded-lg border text-sm font-medium transition-all",
                        formTime === slot
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                          : "border-border hover:border-cyan-400/50 hover:bg-muted"
                      )}>
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Table assignment */}
          <div className="flex flex-col gap-1.5">
            <Label>Mesa (opcional)</Label>
            <div className="grid grid-cols-6 gap-1.5">
              <button type="button" onClick={() => setFormTableId("")}
                className={cn("py-2 rounded-lg border text-xs font-medium transition-all",
                  !formTableId ? "bg-muted border-primary text-foreground" : "border-border hover:bg-muted")}>
                Sin asignar
              </button>
              {RESTAURANT_TABLES.map(table => {
                const taken = takenTableIds.has(table.id);
                const selected = formTableId === table.id;
                return (
                  <button key={table.id} type="button"
                    onClick={() => !taken && setFormTableId(table.id)}
                    disabled={taken}
                    className={cn(
                      "aspect-square rounded-lg border text-sm font-bold transition-all",
                      selected ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 scale-105"
                        : taken ? "bg-red-500/10 border-red-500/30 text-red-400/50 cursor-not-allowed"
                        : "border-border hover:border-cyan-400/50 hover:bg-muted"
                    )}>
                    {table.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">Las mesas en rojo ya tienen reserva a esa hora</p>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" placeholder="Alergias, celebración, preferencias..." rows={2} value={formNotes} onChange={e => setFormNotes(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 rounded-lg" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1 rounded-lg" onClick={onSubmit}
              disabled={isLoading || !formName.trim() || !formPhone.trim() || !formDate || !formTime || closed}>
              {isLoading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear reserva"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
