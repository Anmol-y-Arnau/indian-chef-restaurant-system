import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { MENU_ITEMS } from "@/lib/data";
import { trpc } from "@/lib/trpc";
import { Zap, Sparkles, Hash, CheckCircle2, XCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AIResultItem = {
  itemId: string;
  itemName: string;
  quantity: number;
  spiceLevel: string | null;
  confidence: 'high' | 'medium' | 'low';
  originalText: string;
};

type Mode = 'numbers' | 'ai';

export function QuickOrderDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('ai');
  const [input, setInput] = useState("");
  const [aiResults, setAiResults] = useState<AIResultItem[] | null>(null);
  const [unrecognized, setUnrecognized] = useState<string[]>([]);
  const { activeTableId, addOrderToTable } = useRestaurant();

  const parseAIMutation = trpc.restaurant.parseOrderWithAI.useMutation();

  const handleClose = () => {
    setOpen(false);
    setInput("");
    setAiResults(null);
    setUnrecognized([]);
  };

  // ── Modo clásico por números ──────────────────────────────────────────────
  const handleProcessNumbers = () => {
    if (activeTableId === null) {
      toast.error("Selecciona una mesa primero");
      return;
    }
    if (!input.trim()) return;

    const parts = input.split(/[\s,]+/);
    let addedCount = 0;
    const notFound: number[] = [];

    for (const part of parts) {
      if (!part) continue;
      let itemNumberStr = part;
      let quantity = 1;

      if (part.toLowerCase().includes('x')) {
        const [num, qty] = part.toLowerCase().split('x');
        itemNumberStr = num;
        quantity = parseInt(qty) || 1;
      } else if (part.includes('*')) {
        const [num, qty] = part.split('*');
        itemNumberStr = num;
        quantity = parseInt(qty) || 1;
      }

      const itemNumber = parseInt(itemNumberStr);
      if (isNaN(itemNumber)) continue;

      const item = MENU_ITEMS.find(i => i.number === itemNumber);
      if (item) {
        addOrderToTable(activeTableId, item, { quantity });
        addedCount += quantity;
      } else {
        notFound.push(itemNumber);
      }
    }

    if (addedCount > 0) {
      toast.success(`${addedCount} productos añadidos`);
      handleClose();
    }
    if (notFound.length > 0) {
      toast.warning(`No se encontraron los números: ${notFound.join(", ")}`);
    }
  };

  // ── Modo IA ───────────────────────────────────────────────────────────────
  const handleParseWithAI = async () => {
    if (activeTableId === null) {
      toast.error("Selecciona una mesa primero");
      return;
    }
    if (!input.trim()) return;

    const catalog = MENU_ITEMS.map(item => ({
      id: item.id,
      number: item.number,
      name: item.name,
      price: item.price,
      category: item.category,
    }));

    try {
      const result = await parseAIMutation.mutateAsync({
        text: input,
        menuCatalog: catalog,
      });
      setAiResults(result.items);
      setUnrecognized(result.unrecognized);
    } catch {
      toast.error("Error al procesar con IA. Inténtalo de nuevo.");
    }
  };

  const handleRemoveAIItem = (index: number) => {
    setAiResults(prev => prev ? prev.filter((_, i) => i !== index) : null);
  };

  const handleConfirmAIOrder = () => {
    if (!aiResults || activeTableId === null) return;

    let addedCount = 0;
    for (const result of aiResults) {
      const menuItem = MENU_ITEMS.find(i => i.id === result.itemId);
      if (menuItem) {
        addOrderToTable(activeTableId, menuItem, {
          quantity: result.quantity,
          spiceLevel: result.spiceLevel ?? undefined,
        });
        addedCount += result.quantity;
      }
    }

    if (addedCount > 0) {
      toast.success(`✅ ${addedCount} productos añadidos por IA`);
      handleClose();
    } else {
      toast.error("No se pudo añadir ningún producto");
    }
  };

  const confidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    if (confidence === 'high') return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    if (confidence === 'medium') return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />;
    return <XCircle className="w-3.5 h-3.5 text-red-400" />;
  };

  const spiceLevelLabel = (level: string | null) => {
    if (!level || level === '-') return null;
    const map: Record<string, string> = { '-': '❄️ Sin picante', '+-': '🌶 Poco', '+': '🌶🌶 Picante', '++': '🌶🌶🌶 Muy picante' };
    return map[level] ?? level;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10">
          <Zap className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Pedido Rápido</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Pedido Rápido
          </DialogTitle>
          <DialogDescription>
            Escribe el pedido en texto libre y la IA lo interpreta automáticamente.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Switcher */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          <button
            onClick={() => { setMode('ai'); setAiResults(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
              mode === 'ai'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Texto libre (IA)
          </button>
          <button
            onClick={() => { setMode('numbers'); setAiResults(null); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all",
              mode === 'numbers'
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Hash className="w-4 h-4" />
            Por números
          </button>
        </div>

        {/* Input Area */}
        {!aiResults && (
          <div className="grid gap-3 py-2">
            {mode === 'ai' ? (
              <>
                <Textarea
                  placeholder={`Ej: "2 butter chicken picante, 1 naan, 1 cerveza, menú del día sin picante"`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[110px] text-base resize-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      handleParseWithAI();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Escribe como si le dictaras el pedido a alguien. La IA reconoce nombres de platos, cantidades y nivel de picante. Pulsa <kbd className="bg-muted border border-border px-1 rounded text-[10px]">Ctrl+Enter</kbd> para procesar.
                </p>
              </>
            ) : (
              <>
                <Textarea
                  placeholder="Ej: 1, 4, 10x2, 55"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[100px] text-lg font-mono"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Números separados por comas o espacios. Usa <code className="bg-muted px-1 rounded">12x2</code> para añadir el plato 12 dos veces.
                </p>
              </>
            )}
          </div>
        )}

        {/* AI Results Preview */}
        {aiResults && (
          <div className="grid gap-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {aiResults.length > 0
                  ? `✅ ${aiResults.length} plato${aiResults.length !== 1 ? 's' : ''} reconocido${aiResults.length !== 1 ? 's' : ''}`
                  : '⚠️ No se reconoció ningún plato'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setAiResults(null); }}
                className="text-xs h-7"
              >
                Editar texto
              </Button>
            </div>

            {/* Recognized items */}
            {aiResults.length > 0 && (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {aiResults.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border group"
                  >
                    <div className="mt-0.5">{confidenceIcon(item.confidence)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">{item.itemName}</span>
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">×{item.quantity}</Badge>
                        {item.spiceLevel && item.spiceLevel !== '-' && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 border-orange-500/50 text-orange-400">
                            {spiceLevelLabel(item.spiceLevel)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        "{item.originalText}"
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveAIItem(index)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Unrecognized */}
            {unrecognized.length > 0 && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-xs font-medium text-yellow-400 mb-1">⚠️ No reconocido:</p>
                <p className="text-xs text-muted-foreground">{unrecognized.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose} className="mr-auto">
            Cancelar
          </Button>

          {!aiResults ? (
            mode === 'ai' ? (
              <Button
                onClick={handleParseWithAI}
                disabled={!input.trim() || parseAIMutation.isPending}
                className="gap-2"
              >
                {parseAIMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Interpretar con IA
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleProcessNumbers} disabled={!input.trim()}>
                Añadir a Mesa {activeTableId !== null ? activeTableId : '?'}
              </Button>
            )
          ) : (
            <Button
              onClick={handleConfirmAIOrder}
              disabled={aiResults.length === 0}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmar {aiResults.length} plato{aiResults.length !== 1 ? 's' : ''} → Mesa {activeTableId}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
