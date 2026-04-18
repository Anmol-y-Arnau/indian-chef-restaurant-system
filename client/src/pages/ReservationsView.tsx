import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
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
  parseISO,
  addWeeks,
  subWeeks,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: "Pendiente",   color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",   icon: <AlertCircle className="w-3 h-3" /> },
  confirmed: { label: "Confirmada",  color: "bg-green-500/20 text-green-400 border-green-500/30",      icon: <CheckCircle className="w-3 h-3" /> },
  seated:    { label: "Sentada",     color: "bg-blue-500/20 text-blue-400 border-blue-500/30",         icon: <UserCheck className="w-3 h-3" /> },
  cancelled: { label: "Cancelada",   color: "bg-red-500/20 text-red-400 border-red-500/30",            icon: <XCircle className="w-3 h-3" /> },
  no_show:   { label: "No apareció", color: "bg-gray-500/20 text-gray-400 border-gray-500/30",         icon: <XCircle className="w-3 h-3" /> },
};

const ORIGIN_CONFIG = {
  manual: { label: "Manual", color: "bg-purple-500/20 text-purple-400" },
  web:    { label: "Web",    color: "bg-cyan-500/20 text-cyan-400" },
  phone:  { label: "Teléfono", color: "bg-orange-500/20 text-orange-400" },
};

const TIME_SLOTS = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00", "22:30", "23:00",
];

const EMPTY_FORM = {
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  date: format(new Date(), "yyyy-MM-dd"),
  time: "20:00",
  partySize: 2,
  tableId: "",
  status: "confirmed" as ReservationStatus,
  notes: "",
  origin: "manual" as "manual" | "web" | "phone",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReservationsView() {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // ── Date range for current view ──
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const startDate = format(viewMode === "week" ? weekStart : currentDate, "yyyy-MM-dd");
  const endDate = format(viewMode === "week" ? weekEnd : currentDate, "yyyy-MM-dd");

  // ── Data fetching ──
  const { data: reservations = [], refetch } = trpc.reservations.getByDateRange.useQuery(
    { startDate, endDate },
    { refetchInterval: 30_000 }
  );

  // ── Mutations ──
  const createMutation = trpc.reservations.create.useMutation({
    onSuccess: () => { toast.success("Reserva creada"); refetch(); setIsFormOpen(false); setForm(EMPTY_FORM); },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const updateMutation = trpc.reservations.update.useMutation({
    onSuccess: (updated) => {
      toast.success("Reserva actualizada");
      refetch();
      setIsFormOpen(false);
      setEditingReservation(null);
      if (updated) setSelectedReservation(updated as Reservation);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const statusMutation = trpc.reservations.updateStatus.useMutation({
    onSuccess: (updated) => {
      toast.success("Estado actualizado");
      refetch();
      if (updated) setSelectedReservation(updated as Reservation);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const deleteMutation = trpc.reservations.delete.useMutation({
    onSuccess: () => { toast.success("Reserva eliminada"); refetch(); setSelectedReservation(null); },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // ── Helpers ──
  const getReservationsForDay = (date: Date) =>
    (reservations as Reservation[]).filter(r => r.date === format(date, "yyyy-MM-dd"));

  const openNewForm = (date?: Date) => {
    setEditingReservation(null);
    setForm({ ...EMPTY_FORM, date: format(date ?? currentDate, "yyyy-MM-dd") });
    setIsFormOpen(true);
  };

  const openEditForm = (r: Reservation) => {
    setEditingReservation(r);
    setForm({
      guestName: r.guestName,
      guestPhone: r.guestPhone,
      guestEmail: r.guestEmail ?? "",
      date: r.date,
      time: r.time,
      partySize: r.partySize,
      tableId: r.tableId ?? "",
      status: r.status,
      notes: r.notes ?? "",
      origin: r.origin,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      guestEmail: form.guestEmail || null,
      tableId: form.tableId || null,
      notes: form.notes || null,
    };
    if (editingReservation) {
      updateMutation.mutate({ id: editingReservation.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // ── Summary stats for current view ──
  const stats = useMemo(() => {
    const all = reservations as Reservation[];
    return {
      total: all.length,
      confirmed: all.filter(r => r.status === "confirmed").length,
      pending: all.filter(r => r.status === "pending").length,
      covers: all.filter(r => ["confirmed", "seated"].includes(r.status)).reduce((s, r) => s + r.partySize, 0),
    };
  }, [reservations]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-lg">Reservas</h1>
        </div>

        {/* Stats pills */}
        <div className="hidden md:flex items-center gap-2 ml-2">
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {stats.total} reservas
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            {stats.confirmed} confirmadas
          </span>
          {stats.pending > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
              {stats.pending} pendientes
            </span>
          )}
          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
            {stats.covers} comensales
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("week")}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "week" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >Semana</button>
            <button
              onClick={() => setViewMode("day")}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "day" ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
            >Día</button>
          </div>

          {/* Navigation */}
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-full"
            onClick={() => setCurrentDate(d => viewMode === "week" ? subWeeks(d, 1) : subDays(d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-muted transition-colors min-w-[120px] text-center"
          >
            {viewMode === "week"
              ? `${format(weekStart, "d MMM", { locale: es })} – ${format(weekEnd, "d MMM", { locale: es })}`
              : format(currentDate, "EEEE d MMM", { locale: es })}
          </button>
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-full"
            onClick={() => setCurrentDate(d => viewMode === "week" ? addWeeks(d, 1) : addDays(d, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button onClick={() => openNewForm()} className="gap-1.5 rounded-full px-4">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva reserva</span>
          </Button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Calendar ── */}
        <div className="flex-1 overflow-auto">
          {viewMode === "week" ? (
            <WeekView
              days={weekDays}
              reservations={reservations as Reservation[]}
              onSelectReservation={setSelectedReservation}
              onAddReservation={openNewForm}
              selectedId={selectedReservation?.id}
            />
          ) : (
            <DayView
              date={currentDate}
              reservations={getReservationsForDay(currentDate)}
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
            onDelete={() => {
              if (confirm("¿Eliminar esta reserva?")) deleteMutation.mutate({ id: selectedReservation.id });
            }}
            onStatusChange={(status) => statusMutation.mutate({ id: selectedReservation.id, status })}
          />
        )}
      </div>

      {/* ── Form Dialog ── */}
      <ReservationFormDialog
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingReservation(null); }}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        isEditing={!!editingReservation}
        isLoading={createMutation.isPending || updateMutation.isPending}
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
        const dayReservations = reservations.filter(r => r.date === format(day, "yyyy-MM-dd"));
        const isToday = isSameDay(day, today);
        return (
          <div key={day.toISOString()} className={cn(
            "border-r border-border last:border-r-0 flex flex-col min-h-full",
            isToday && "bg-primary/5"
          )}>
            {/* Day header */}
            <div className={cn(
              "sticky top-0 z-10 px-2 py-2 border-b border-border text-center bg-card",
              isToday && "bg-primary/10"
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
              {dayReservations.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {dayReservations.length} reserva{dayReservations.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Reservations */}
            <ScrollArea className="flex-1">
              <div className="p-1.5 flex flex-col gap-1.5 pb-16">
                {dayReservations
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(r => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      compact
                      selected={r.id === selectedId}
                      onClick={() => onSelectReservation(r)}
                    />
                  ))}
              </div>
            </ScrollArea>

            {/* Add button */}
            <button
              onClick={() => onAddReservation(day)}
              className="shrink-0 m-1.5 p-1.5 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary flex items-center justify-center gap-1 text-xs"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden lg:inline">Añadir</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Day View ─────────────────────────────────────────────────────────────────

function DayView({ date, reservations, onSelectReservation, onAddReservation, selectedId }: {
  date: Date;
  reservations: Reservation[];
  onSelectReservation: (r: Reservation) => void;
  onAddReservation: () => void;
  selectedId?: number;
}) {
  const sorted = [...reservations].sort((a, b) => a.time.localeCompare(b.time));
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold capitalize">
          {format(date, "EEEE d 'de' MMMM", { locale: es })}
        </h2>
        <Button onClick={onAddReservation} size="sm" className="gap-1.5 rounded-full">
          <Plus className="w-4 h-4" /> Nueva reserva
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay reservas para este día</p>
          <Button variant="outline" onClick={onAddReservation} className="mt-4 rounded-full gap-1.5">
            <Plus className="w-4 h-4" /> Añadir reserva
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(r => (
            <ReservationCard
              key={r.id}
              reservation={r}
              selected={r.id === selectedId}
              onClick={() => onSelectReservation(r)}
            />
          ))}
        </div>
      )}
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
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border p-2 transition-all hover:scale-[1.02] active:scale-100",
        selected ? "border-primary bg-primary/10 shadow-md" : "border-border bg-card hover:border-primary/50",
        r.status === "cancelled" && "opacity-50"
      )}
    >
      <div className="flex items-start gap-1.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm truncate">{r.guestName}</span>
            {!compact && (
              <span className={cn("text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1", status.color)}>
                {status.icon}{status.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.partySize} pax</span>
            {r.tableId && <span className="flex items-center gap-1"><Utensils className="w-3 h-3" />Mesa {r.tableId}</span>}
          </div>
          {compact && (
            <div className={cn("mt-1 text-xs px-1.5 py-0.5 rounded-full border inline-flex items-center gap-1 w-fit", status.color)}>
              {status.icon}{status.label}
            </div>
          )}
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
  const origin = ORIGIN_CONFIG[r.origin];
  const dateObj = parseISO(r.date);

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-bold">Detalle de reserva</h3>
        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 flex flex-col gap-4">
          {/* Guest info */}
          <div>
            <div className="text-lg font-bold">{r.guestName}</div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <Phone className="w-3.5 h-3.5" />
              <a href={`tel:${r.guestPhone}`} className="hover:text-foreground transition-colors">{r.guestPhone}</a>
            </div>
            {r.guestEmail && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Mail className="w-3.5 h-3.5" />
                <a href={`mailto:${r.guestEmail}`} className="hover:text-foreground transition-colors truncate">{r.guestEmail}</a>
              </div>
            )}
          </div>

          {/* Reservation details */}
          <div className="rounded-lg bg-muted/50 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="capitalize font-medium">{format(dateObj, "EEEE d 'de' MMMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">{r.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span>{r.partySize} {r.partySize === 1 ? "comensal" : "comensales"}</span>
            </div>
            {r.tableId && (
              <div className="flex items-center gap-2 text-sm">
                <Utensils className="w-4 h-4 text-primary" />
                <span>Mesa {r.tableId}</span>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Estado</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(STATUS_CONFIG) as [ReservationStatus, typeof STATUS_CONFIG[ReservationStatus]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => onStatusChange(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    r.status === key ? cfg.color + " scale-105 shadow-sm" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cfg.icon}{cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          {r.notes && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Notas</div>
              <p className="text-sm bg-muted/50 rounded-lg p-2">{r.notes}</p>
            </div>
          )}

          {/* Origin */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Origen:</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full", origin.color)}>{origin.label}</span>
          </div>

          {/* Created at */}
          <div className="text-xs text-muted-foreground">
            Creada el {format(new Date(r.createdAt), "d MMM yyyy 'a las' HH:mm", { locale: es })}
          </div>
        </div>
      </ScrollArea>

      {/* Actions */}
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

function ReservationFormDialog({ open, onClose, form, setForm, onSubmit, isEditing, isLoading }: {
  open: boolean;
  onClose: () => void;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  onSubmit: () => void;
  isEditing: boolean;
  isLoading: boolean;
}) {
  const set = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar reserva" : "Nueva reserva"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Guest name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guestName">Nombre *</Label>
            <Input id="guestName" placeholder="Nombre del cliente" value={form.guestName} onChange={set("guestName")} />
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guestPhone">Teléfono *</Label>
            <Input id="guestPhone" type="tel" placeholder="+34 600 000 000" value={form.guestPhone} onChange={set("guestPhone")} />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guestEmail">Email (opcional)</Label>
            <Input id="guestEmail" type="email" placeholder="cliente@email.com" value={form.guestEmail} onChange={set("guestEmail")} />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Fecha *</Label>
              <Input id="date" type="date" value={form.date} onChange={set("date")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Hora *</Label>
              <Select value={form.time} onValueChange={v => setForm(f => ({ ...f, time: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Party size + Table */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="partySize">Comensales *</Label>
              <Input
                id="partySize"
                type="number"
                min={1}
                max={50}
                value={form.partySize}
                onChange={e => setForm(f => ({ ...f, partySize: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tableId">Mesa (opcional)</Label>
              <Input id="tableId" placeholder="Ej: 3" value={form.tableId} onChange={set("tableId")} />
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ReservationStatus }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(STATUS_CONFIG) as [ReservationStatus, typeof STATUS_CONFIG[ReservationStatus]][]).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origin */}
          <div className="flex flex-col gap-1.5">
            <Label>Origen</Label>
            <Select value={form.origin} onValueChange={v => setForm(f => ({ ...f, origin: v as "manual" | "web" | "phone" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (añadida aquí)</SelectItem>
                <SelectItem value="phone">Teléfono</SelectItem>
                <SelectItem value="web">Web (reserva online)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea id="notes" placeholder="Alergias, celebración especial, preferencias de mesa..." rows={3} value={form.notes} onChange={set("notes")} />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 rounded-lg" onClick={onClose}>Cancelar</Button>
            <Button
              className="flex-1 rounded-lg"
              onClick={onSubmit}
              disabled={isLoading || !form.guestName || !form.guestPhone || !form.date || !form.time}
            >
              {isLoading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear reserva"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
