import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, X, ChefHat } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FrequentCustomItemsSuggestionsProps {
  /** Si es true, muestra el panel completo de gestión. Si es false, solo el banner de sugerencia */
  compact?: boolean;
}

/**
 * Muestra sugerencias de platos personalizados frecuentes para añadir al menú fijo.
 * Aparece cuando un plato de "Varios" se ha pedido 3 o más veces.
 */
export function FrequentCustomItemsSuggestions({ compact = false }: FrequentCustomItemsSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const { data: frequentItems = [], refetch } = trpc.restaurant.getFrequentCustomItems.useQuery(
    { minCount: 3 },
    { refetchInterval: 60000 } // Actualizar cada minuto
  );

  const markAsAddedMutation = trpc.restaurant.markCustomItemAsAddedToMenu.useMutation({
    onSuccess: () => {
      toast.success("Marcado como añadido al menú");
      refetch();
    },
  });

  const visibleItems = frequentItems.filter(item => !dismissed.has(item.id));

  if (visibleItems.length === 0) return null;

  const handleDismiss = (id: number) => {
    setDismissed(prev => { const next = new Set(prev); next.add(id); return next; });
  };

  const handleMarkAsAdded = (id: number) => {
    markAsAddedMutation.mutate({ id });
  };

  if (compact) {
    // Versión compacta: solo un banner con el primer item más frecuente
    const topItem = visibleItems[0];
    return (
      <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-sm">
        <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span className="text-amber-300 flex-1">
          <strong>"{topItem.originalName}"</strong> pedido {topItem.count}x — ¿añadir al menú?
        </span>
        <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-xs">
          {topItem.count}x
        </Badge>
        <button
          onClick={() => handleMarkAsAdded(topItem.id)}
          className="text-xs text-amber-400 hover:text-amber-300 underline whitespace-nowrap"
        >
          Ya está
        </button>
        <button
          onClick={() => handleDismiss(topItem.id)}
          className="text-slate-500 hover:text-slate-300"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Versión completa: panel con todos los items frecuentes
  return (
    <div className="border border-amber-500/30 rounded-lg bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <ChefHat className="w-5 h-5 text-amber-400" />
        <h3 className="font-semibold text-amber-300 text-sm">Platos Frecuentes en "Varios"</h3>
        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
          {visibleItems.length}
        </Badge>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Estos platos se han pedido como "Varios" varias veces. Puedes añadirlos al menú fijo para que aparezcan directamente.
      </p>
      <div className="space-y-2">
        {visibleItems.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 bg-slate-800/50 rounded-lg px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate">{item.originalName}</p>
              <p className="text-xs text-slate-400">Pedido {item.count} veces</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge className="bg-amber-600/30 text-amber-300 border-amber-600/40 text-xs">
                {item.count}x
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-green-400 hover:text-green-300 hover:bg-green-900/20"
                onClick={() => handleMarkAsAdded(item.id)}
                disabled={markAsAddedMutation.isPending}
              >
                Ya añadido ✓
              </Button>
              <button
                onClick={() => handleDismiss(item.id)}
                className="text-slate-600 hover:text-slate-400 p-1"
                title="Ignorar sugerencia"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
