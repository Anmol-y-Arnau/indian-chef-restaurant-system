import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Users, Clock, Phone, User, ChevronLeft, ChevronRight,
  CalendarDays, Zap, AlertTriangle, CheckCircle2, XCircle, Eye, Trash2,
  Flame, MessageSquare, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  assignedTableIds?: string | null;
  assignmentInstruction?: string | null;
  estimatedEnd?: string | null;
  isPeakDay?: number;
  status: ReservationStatus;
  notes?: string | null;
  origin: "manual" | "web" | "phone";
  createdAt: Date;
  updatedAt: Date;
}

interface WalkIn {
  id: number;
  date: string;
  time: string;
  partySize: number;
  assignedTableIds: string;
  assignmentInstruction?: string | null;
  estimatedEnd?: string | null;
  status: "seated" | "finished" | "cancelled";
  notes?: string | null;
  createdAt: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RESTAURANT_TABLES = [
  { id: "0+", label: "0+", capacity: 2, zone: "A", description: "Entrada izq." },
  { id: "0-", label: "0-", capacity: 4, zone: "A", description: "Entrada" },
  { id: "1",  label: "1",  capacity: 4, zone: "A", description: "Entrada der." },
  { id: "2",  label: "2",  capacity: 4, zone: "B", description: "Centro" },
  { id: "3",  label: "3",  capacity: 4, zone: "B", description: "Centro" },
  { id: "4",  label: "4",  capacity: 4, zone: "B", description: "Centro" },
  { id: "5",  label: "5",  capacity: 4, zone: "C", description: "Fondo" },
  { id: "6",  label: "6",  capacity: 4, zone: "C", description: "Fondo" },
  { id: "7",  label: "7",  capacity: 4, zone: "C", description: "Fondo" },
  { id: "8",  label: "8",  capacity: 2, zone: "C", description: "Fondo aislada" },
  { id: "T",  label: "🌿", capacity: 4, zone: "T", description: "Terraza" },
];

const COMBINATION_RULES = [
  { tables: ["0+", "0-"],       capacity: 6,  label: "0+ + 0− → 6 pax" },
  { tables: ["6", "8"],         capacity: 6,  label: "6 + 8 → 6 pax" },
  { tables: ["5", "6"],         capacity: 8,  label: "5 + 6 → 8 pax" },
  { tables: ["0+", "0-", "1"],  capacity: 8,  label: "0+ + 0− + 1 → 8 pax" },
  { tables: ["5", "6", "8"],    capacity: 10, label: "5 + 6 + 8 → 10 pax" },
];

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pendiente",   color: "text-yellow-400",  bg: "bg-yellow-400/20 border-yellow-400/40" },
  confirmed: { label: "Confirmada",  color: "text-green-400",   bg: "bg-green-400/20 border-green-400/40" },
  seated:    { label: "Sentada",     color: "text-blue-400",    bg: "bg-blue-400/20 border-blue-400/40" },
  cancelled: { label: "Cancelada",   color: "text-red-400",     bg: "bg-red-400/20 border-red-400/40" },
  no_show:   { label: "No apareció", color: "text-gray-400",    bg: "bg-gray-400/20 border-gray-400/40" },
};

function getTimeSlotsForDate(dateStr: string): string[] {
  const dow = new Date(dateStr + "T12:00:00").getDay();
  if (dow === 2) return [];
  const lunch = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
  const dinnerBase = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00"];
  const dinnerLate = [...dinnerBase, "23:30"];
  return [...lunch, ...(dow === 5 || dow === 6 ? dinnerLate : dinnerBase)];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─── Table Map Component ──────────────────────────────────────────────────────

function TableMap({
  occupiedTableIds,
  highlightTableIds = [],
  onTableClick,
}: {
  occupiedTableIds: Set<string>;
  highlightTableIds?: string[];
  onTableClick?: (id: string) => void;
}) {
  const getTableColor = (id: string) => {
    if (highlightTableIds.includes(id)) return "bg-amber-500/80 border-amber-400 text-black scale-110 shadow-lg shadow-amber-500/30";
    if (occupiedTableIds.has(id)) return "bg-red-500/70 border-red-400 text-white";
    return "bg-green-500/20 border-green-500/60 text-green-300 hover:bg-green-500/30";
  };

  const renderTable = (t: typeof RESTAURANT_TABLES[0]) => (
    <button
      key={t.id}
      onClick={() => onTableClick?.(t.id)}
      className={cn(
        "rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-200 cursor-default",
        getTableColor(t.id),
        onTableClick && "cursor-pointer"
      )}
      style={{ width: 52, height: 52 }}
      title={`Mesa ${t.label} — ${t.capacity} pax — ${t.description}`}
    >
      <span className="font-bold text-sm leading-none">{t.label}</span>
      <span className="text-[10px] opacity-70">{t.capacity}p</span>
    </button>
  );

  const zoneA = RESTAURANT_TABLES.filter(t => t.zone === "A");
  const zoneB = RESTAURANT_TABLES.filter(t => t.zone === "B");
  const zoneC = RESTAURANT_TABLES.filter(t => t.zone === "C");
  const zoneT = RESTAURANT_TABLES.filter(t => t.zone === "T");

  return (
    <div className="bg-black/30 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plano del comedor</span>
        <div className="flex gap-3 ml-auto text-[10px]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/40 border border-green-500/60 inline-block" />Libre</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/60 border border-red-400 inline-block" />Ocupada</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80 border border-amber-400 inline-block" />Asignada</span>
        </div>
      </div>

      {/* Zone A — Entrada */}
      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Zona A — Entrada</p>
        <div className="flex gap-2 flex-wrap">
          {zoneA.map(renderTable)}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {COMBINATION_RULES.filter(r => r.tables.every(id => ["0+","0-","1"].includes(id))).map(r => (
            <span key={r.label} className="text-[10px] text-muted-foreground bg-white/5 rounded px-1.5 py-0.5 border border-white/10">
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* Zone B — Centro */}
      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Zona B — Centro</p>
        <div className="flex gap-2 flex-wrap">
          {zoneB.map(renderTable)}
        </div>
      </div>

      {/* Zone C — Fondo */}
      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Zona C — Fondo</p>
        <div className="flex gap-2 flex-wrap">
          {zoneC.map(renderTable)}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {COMBINATION_RULES.filter(r => r.tables.some(id => ["5","6","8"].includes(id))).map(r => (
            <span key={r.label} className="text-[10px] text-muted-foreground bg-white/5 rounded px-1.5 py-0.5 border border-white/10">
              {r.label}
            </span>
          ))}
        </div>
      </div>

      {/* Terraza */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">Terraza</p>
        <div className="flex gap-2">
          {zoneT.map(renderTable)}
        </div>
      </div>
    </div>
  );
}

// ─── Walk-in Quick Entry ──────────────────────────────────────────────────────

function WalkInPanel({ date, time, onCreated }: { date: string; time: string; onCreated: () => void }) {
  const [text, setText] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [mode, setMode] = useState<"text" | "auto">("auto");

  const createFromText = trpc.walkIns.createFromText.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Walk-in registrado: ${data.parsed?.tableId} — ${data.parsed?.partySize} personas`);
        setText("");
        onCreated();
      } else {
        toast.error(data.reason ?? "Error al registrar walk-in");
      }
    },
  });

  const createWithAssignment = trpc.walkIns.createWithAssignment.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Walk-in asignado: ${data.assignment?.instruction}`);
        onCreated();
      } else {
        toast.error(data.reason ?? "No hay mesas disponibles");
      }
    },
  });

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-semibold text-amber-300">Walk-in sin reserva</span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setMode("auto")}
            className={cn("text-xs px-2 py-0.5 rounded", mode === "auto" ? "bg-amber-500 text-black" : "text-muted-foreground hover:text-foreground")}
          >Auto</button>
          <button
            onClick={() => setMode("text")}
            className={cn("text-xs px-2 py-0.5 rounded", mode === "text" ? "bg-amber-500 text-black" : "text-muted-foreground hover:text-foreground")}
          >Texto</button>
        </div>
      </div>

      {mode === "auto" ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">Personas</Label>
            <div className="flex items-center gap-2">
              <button onClick={() => setPartySize(p => Math.max(1, p - 1))} className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-sm font-bold">−</button>
              <span className="text-lg font-bold w-6 text-center">{partySize}</span>
              <button onClick={() => setPartySize(p => Math.min(14, p + 1))} className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-sm font-bold">+</button>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            onClick={() => createWithAssignment.mutate({ date, time, partySize })}
            disabled={createWithAssignment.isPending}
          >
            {createWithAssignment.isPending ? "..." : "Asignar mesa"}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='ej: "mesa 2 3 personas"'
            className="flex-1 bg-black/30 border-white/20 text-sm h-8"
            onKeyDown={e => e.key === "Enter" && text.trim() && createFromText.mutate({ text, date, time })}
          />
          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            onClick={() => createFromText.mutate({ text, date, time })}
            disabled={!text.trim() || createFromText.isPending}
          >
            OK
          </Button>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-2">
        {mode === "text"
          ? 'Formato: "mesa [número] [personas] personas" o "terraza [personas] personas"'
          : "El sistema asignará la mesa más adecuada automáticamente"}
      </p>
    </div>
  );
}

// ─── Reservation Card ─────────────────────────────────────────────────────────

function ReservationCard({
  reservation,
  onStatusChange,
  onDelete,
}: {
  reservation: Reservation;
  onStatusChange: (id: number, status: ReservationStatus) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = STATUS_CONFIG[reservation.status];
  const tableIds: string[] = reservation.assignedTableIds
    ? JSON.parse(reservation.assignedTableIds)
    : reservation.tableId ? [reservation.tableId] : [];

  return (
    <div className={cn("rounded-xl border p-3 transition-all", cfg.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{reservation.guestName}</span>
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", cfg.color, "border-current")}>
              {cfg.label}
            </Badge>
            {reservation.origin === "web" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-blue-400 border-blue-400/50">Web</Badge>
            )}
            {reservation.isPeakDay ? (
              <span title="Día punta"><Flame className="w-3 h-3 text-orange-400" /></span>
            ) : null}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{reservation.time}{reservation.estimatedEnd ? `–${reservation.estimatedEnd}` : ""}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{reservation.partySize} pax</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{reservation.guestPhone}</span>
          </div>
          {reservation.assignmentInstruction && (
            <p className="text-xs text-amber-300 mt-1 font-medium">
              📍 {reservation.assignmentInstruction}
            </p>
          )}
          {tableIds.length > 0 && !reservation.assignmentInstruction && (
            <p className="text-xs text-muted-foreground mt-1">Mesa: {tableIds.join(", ")}</p>
          )}
          {reservation.notes && (
            <p className="text-xs text-muted-foreground mt-1 italic">"{reservation.notes}"</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {reservation.status !== "seated" && reservation.status !== "cancelled" && reservation.status !== "no_show" && (
            <button
              onClick={() => onStatusChange(reservation.id, "seated")}
              className="w-7 h-7 rounded bg-blue-500/20 hover:bg-blue-500/40 flex items-center justify-center"
              title="Marcar como sentada"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
          {reservation.status !== "cancelled" && (
            <button
              onClick={() => onStatusChange(reservation.id, "cancelled")}
              className="w-7 h-7 rounded bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center"
              title="Cancelar"
            >
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            </button>
          )}
          <button
            onClick={() => onDelete(reservation.id)}
            className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Walk-in Card ─────────────────────────────────────────────────────────────

function WalkInCard({ walkIn, onFinish }: { walkIn: WalkIn; onFinish: (id: number) => void }) {
  const tableIds: string[] = JSON.parse(walkIn.assignedTableIds);
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-sm text-amber-300">Walk-in</span>
            <span className="text-xs text-muted-foreground">{walkIn.time}</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{walkIn.partySize} pax</span>
            <span>Mesa: {tableIds.join(", ")}</span>
            {walkIn.estimatedEnd && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />hasta {walkIn.estimatedEnd}</span>}
          </div>
          {walkIn.assignmentInstruction && (
            <p className="text-xs text-amber-300 mt-1">📍 {walkIn.assignmentInstruction}</p>
          )}
        </div>
        <button
          onClick={() => onFinish(walkIn.id)}
          className="text-xs bg-green-500/20 hover:bg-green-500/40 border border-green-500/30 rounded px-2 py-1 text-green-400 font-medium"
        >
          Liberar
        </button>
      </div>
    </div>
  );
}

// ─── New Reservation Dialog ───────────────────────────────────────────────────

function NewReservationDialog({
  open,
  onClose,
  defaultDate,
  defaultTime,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  defaultTime: string;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    guestName: "",
    guestPhone: "",
    date: defaultDate,
    time: defaultTime,
    partySize: 2,
    notes: "",
    origin: "manual" as "manual" | "web" | "phone",
  });
  const [assignment, setAssignment] = useState<{ success: boolean; instruction?: string; reason?: string } | null>(null);

  const timeSlots = getTimeSlotsForDate(form.date);
  const isClosed = timeSlots.length === 0;

  const checkAssignment = trpc.reservations.assignTable.useQuery(
    { date: form.date, time: form.time, partySize: form.partySize },
    { enabled: !!form.date && !!form.time && form.partySize > 0 && !isClosed }
  );

  useEffect(() => {
    if (checkAssignment.data) setAssignment(checkAssignment.data);
  }, [checkAssignment.data]);

  const createMutation = trpc.reservations.createWithAssignment.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Reserva creada — ${data.assignment?.instruction}`);
        onCreated();
        onClose();
      } else {
        toast.error(data.reason ?? "No hay mesas disponibles");
      }
    },
  });

  const handleSubmit = () => {
    if (!form.guestName.trim() || !form.guestPhone.trim()) {
      toast.error("Nombre y teléfono son obligatorios");
      return;
    }
    createMutation.mutate({
      guestName: form.guestName,
      guestPhone: form.guestPhone,
      date: form.date,
      time: form.time,
      partySize: form.partySize,
      notes: form.notes || null,
      origin: form.origin,
    });
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md bg-[#1a1a2e] border-white/20">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Nueva Reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Guest info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Nombre *</Label>
              <Input
                value={form.guestName}
                onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
                placeholder="Nombre del cliente"
                className="bg-black/30 border-white/20 h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Teléfono *</Label>
              <Input
                value={form.guestPhone}
                onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))}
                placeholder="+34 600 000 000"
                className="bg-black/30 border-white/20 h-9"
              />
            </div>
          </div>

          {/* Date, time, party */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Fecha</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value, time: getTimeSlotsForDate(e.target.value)[0] ?? "" }))}
                className="bg-black/30 border-white/20 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Hora</Label>
              {isClosed ? (
                <div className="h-9 flex items-center text-xs text-red-400">Cerrado (martes)</div>
              ) : (
                <Select value={form.time} onValueChange={v => setForm(f => ({ ...f, time: v }))}>
                  <SelectTrigger className="bg-black/30 border-white/20 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Personas</Label>
              <div className="flex items-center gap-1 h-9">
                <button onClick={() => setForm(f => ({ ...f, partySize: Math.max(1, f.partySize - 1) }))} className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-sm font-bold">−</button>
                <span className="text-base font-bold w-5 text-center">{form.partySize}</span>
                <button onClick={() => setForm(f => ({ ...f, partySize: Math.min(14, f.partySize + 1) }))} className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 text-sm font-bold">+</button>
              </div>
            </div>
          </div>

          {/* Assignment preview */}
          {!isClosed && (
            <div className={cn(
              "rounded-lg p-3 text-sm border",
              checkAssignment.isLoading ? "bg-white/5 border-white/10" :
              assignment?.success ? "bg-green-500/10 border-green-500/30" :
              "bg-red-500/10 border-red-500/30"
            )}>
              {checkAssignment.isLoading ? (
                <span className="text-muted-foreground text-xs">Comprobando disponibilidad...</span>
              ) : assignment?.success ? (
                <span className="text-green-300 text-xs font-medium">✓ {assignment.instruction}</span>
              ) : (
                <span className="text-red-300 text-xs">✗ {assignment?.reason ?? "No disponible"}</span>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Notas (opcional)</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Alergias, celebración, preferencias..."
              className="bg-black/30 border-white/20 text-sm resize-none h-16"
            />
          </div>

          {/* Origin */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Origen</Label>
            <Select value={form.origin} onValueChange={v => setForm(f => ({ ...f, origin: v as any }))}>
              <SelectTrigger className="bg-black/30 border-white/20 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (en persona)</SelectItem>
                <SelectItem value="phone">Teléfono</SelectItem>
                <SelectItem value="web">Web</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} size="sm">Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending || isClosed || !assignment?.success}
            className="bg-primary hover:bg-primary/90"
            size="sm"
          >
            {createMutation.isPending ? "Creando..." : "Crear reserva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReservationsView() {
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [defaultTime, setDefaultTime] = useState(nowTimeStr());
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const isClosed = getTimeSlotsForDate(selectedDate).length === 0;
  const dow = new Date(selectedDate + "T12:00:00").getDay();
  const dayName = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][dow];

  // Fetch reservations
  const reservationsQuery = trpc.reservations.getByDate.useQuery(
    { date: selectedDate },
    { refetchInterval: 30_000 }
  );

  // Fetch walk-ins
  const walkInsQuery = trpc.walkIns.getByDate.useQuery(
    { date: selectedDate },
    { refetchInterval: 30_000 }
  );

  // Peak day check
  const peakQuery = trpc.peakDays.check.useQuery({ date: selectedDate });
  const setPeak = trpc.peakDays.set.useMutation({ onSuccess: () => { peakQuery.refetch(); toast.success("Día marcado como punta"); } });
  const removePeak = trpc.peakDays.remove.useMutation({ onSuccess: () => { peakQuery.refetch(); toast.success("Día punta eliminado"); } });

  const updateStatus = trpc.reservations.updateStatus.useMutation({
    onSuccess: () => reservationsQuery.refetch(),
  });

  const deleteReservation = trpc.reservations.delete.useMutation({
    onSuccess: () => { reservationsQuery.refetch(); toast.success("Reserva eliminada"); },
  });

  const finishWalkIn = trpc.walkIns.finish.useMutation({
    onSuccess: () => { walkInsQuery.refetch(); toast.success("Mesa liberada"); },
  });

  // Build occupied table IDs from active reservations + walk-ins
  const occupiedTableIds = new Set<string>();
  const reservations: Reservation[] = (reservationsQuery.data as Reservation[] | undefined) ?? [];
  const walkIns: WalkIn[] = (walkInsQuery.data as WalkIn[] | undefined) ?? [];

  for (const r of reservations) {
    if (["cancelled", "no_show"].includes(r.status)) continue;
    const ids: string[] = r.assignedTableIds ? JSON.parse(r.assignedTableIds) : (r.tableId ? [r.tableId] : []);
    ids.forEach(id => occupiedTableIds.add(id));
  }
  for (const w of walkIns) {
    if (w.status !== "seated") continue;
    JSON.parse(w.assignedTableIds).forEach((id: string) => occupiedTableIds.add(id));
  }

  // Active walk-ins only
  const activeWalkIns = walkIns.filter(w => w.status === "seated");

  // Sort reservations by time
  const sortedReservations = [...reservations].sort((a, b) => a.time.localeCompare(b.time));
  const activeReservations = sortedReservations.filter(r => !["cancelled", "no_show"].includes(r.status));
  const inactiveReservations = sortedReservations.filter(r => ["cancelled", "no_show"].includes(r.status));

  const totalCovers = activeReservations.reduce((sum, r) => sum + r.partySize, 0)
    + activeWalkIns.reduce((sum, w) => sum + w.partySize, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => setLocation("/")} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <CalendarDays className="w-5 h-5 text-cyan-400" />
          <h1 className="font-bold text-lg">Reservas</h1>

          {/* Date navigation */}
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setSelectedDate(d => addDays(d, -1))} className="p-1.5 rounded hover:bg-white/10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(todayStr())}
              className={cn("px-3 py-1 rounded text-sm font-medium transition-colors", selectedDate === todayStr() ? "bg-primary text-primary-foreground" : "hover:bg-white/10")}
            >
              Hoy
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border border-white/20 rounded px-2 py-1 text-xs w-32"
            />
            <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="p-1.5 rounded hover:bg-white/10">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button onClick={refresh} className="p-1.5 rounded hover:bg-white/10 ml-1" title="Actualizar">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
          <Button size="sm" onClick={() => { setDefaultTime(nowTimeStr()); setShowNewDialog(true); }} className="gap-1.5 ml-1">
            <Plus className="w-4 h-4" />
            Nueva
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Date header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold capitalize">{formatDate(selectedDate)}</h2>
            {isClosed ? (
              <p className="text-red-400 text-sm mt-0.5">🔒 Cerrado (martes)</p>
            ) : (
              <p className="text-muted-foreground text-sm mt-0.5">
                {totalCovers} comensales · {activeReservations.length} reservas{activeWalkIns.length > 0 ? ` · ${activeWalkIns.length} walk-ins` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {peakQuery.data?.isPeak ? (
              <button
                onClick={() => removePeak.mutate({ date: selectedDate })}
                className="flex items-center gap-1.5 text-xs bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-lg px-3 py-1.5 hover:bg-orange-500/30"
              >
                <Flame className="w-3.5 h-3.5" />
                Día punta activo — quitar
              </button>
            ) : (
              <button
                onClick={() => setPeak.mutate({ date: selectedDate })}
                className="flex items-center gap-1.5 text-xs bg-white/5 border border-white/20 text-muted-foreground rounded-lg px-3 py-1.5 hover:bg-white/10"
              >
                <Flame className="w-3.5 h-3.5" />
                Marcar día punta
              </button>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Map + Walk-in */}
          <div className="space-y-4">
            <TableMap occupiedTableIds={occupiedTableIds} />

            {!isClosed && (
              <WalkInPanel
                date={selectedDate}
                time={nowTimeStr()}
                onCreated={() => { walkInsQuery.refetch(); reservationsQuery.refetch(); }}
              />
            )}

            {/* Active walk-ins */}
            {activeWalkIns.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Walk-ins activos ({activeWalkIns.length})
                </h3>
                <div className="space-y-2">
                  {activeWalkIns.map(w => (
                    <WalkInCard key={w.id} walkIn={w} onFinish={id => finishWalkIn.mutate({ id })} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Reservations list */}
          <div>
            {isClosed ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <span className="text-4xl mb-3">🔒</span>
                <p className="font-medium">Cerrado los martes</p>
                <p className="text-sm mt-1">No se aceptan reservas</p>
              </div>
            ) : reservationsQuery.isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Cargando...</div>
            ) : activeReservations.length === 0 && activeWalkIns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <CalendarDays className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-medium">Sin reservas</p>
                <p className="text-sm mt-1">Pulsa "Nueva" para añadir una</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Reservas activas ({activeReservations.length})
                </h3>
                <div className="space-y-2">
                  {activeReservations.map(r => (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                      onDelete={id => deleteReservation.mutate({ id })}
                    />
                  ))}
                </div>

                {inactiveReservations.length > 0 && (
                  <details className="mt-4">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                      Ver canceladas / no aparecidas ({inactiveReservations.length})
                    </summary>
                    <div className="space-y-2 mt-2">
                      {inactiveReservations.map(r => (
                        <ReservationCard
                          key={r.id}
                          reservation={r}
                          onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                          onDelete={id => deleteReservation.mutate({ id })}
                        />
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New reservation dialog */}
      <NewReservationDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        defaultDate={selectedDate}
        defaultTime={defaultTime}
        onCreated={() => { reservationsQuery.refetch(); walkInsQuery.refetch(); }}
      />
    </div>
  );
}
