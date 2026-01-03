import { Table } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface TableCardProps {
  table: Table;
  isActive: boolean;
  onClick: () => void;
  total: number;
}

export function TableCard({ table, isActive, onClick, total }: TableCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 border-2 aspect-square group",
        "hover:shadow-lg hover:-translate-y-1",
        isActive 
          ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,165,0,0.3)]" 
          : "border-border bg-card hover:border-primary/50",
        table.status === 'occupied' && !isActive && "border-l-4 border-l-secondary",
        table.status === 'payment_pending' && "border-dashed border-accent"
      )}
    >
      <div className={cn(
        "absolute top-2 right-2 w-3 h-3 rounded-full",
        table.status === 'free' ? "bg-green-500" : 
        table.status === 'occupied' ? "bg-secondary animate-pulse" : "bg-accent"
      )} />
      
      <h3 className="text-2xl font-heading text-foreground mb-1">{table.name}</h3>
      
      {table.status !== 'free' ? (
        <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-300">
          <span className="text-lg font-bold text-primary">
            {total.toFixed(2)}€
          </span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{table.guests}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
            {table.status === 'payment_pending' ? 'Pagando' : 'Ocupada'}
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Libre</span>
      )}
      
      {isActive && (
        <div className="absolute inset-0 rounded-xl border-2 border-primary opacity-50 animate-ping pointer-events-none" />
      )}
    </button>
  );
}
