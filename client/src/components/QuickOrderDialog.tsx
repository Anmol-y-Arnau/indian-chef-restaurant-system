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
import { useRestaurant } from "@/contexts/RestaurantContext";
import { MENU_ITEMS } from "@/lib/data";
import { Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function QuickOrderDialog() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { activeTableId, addOrderToTable } = useRestaurant();

  const handleProcess = () => {
    if (activeTableId === null) {
      toast.error("Selecciona una mesa primero");
      return;
    }

    if (!input.trim()) return;

    // Parse input: "1, 5, 10x2" -> items
    // Supports:
    // - Single numbers: "1"
    // - Comma or space separated: "1, 2 3"
    // - Quantity syntax: "10x2" or "10*2" (Item 10, quantity 2)

    const parts = input.split(/[\s,]+/);
    let addedCount = 0;
    let notFound = [];

    for (const part of parts) {
      if (!part) continue;

      let itemNumberStr = part;
      let quantity = 1;

      // Check for quantity syntax (e.g., 12x3)
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
        // Add item multiple times if quantity > 1
        // We call addOrderToTable once with quantity if supported, or loop
        // The context's addOrderToTable now supports quantity from previous task
        addOrderToTable(activeTableId, item, quantity);
        addedCount += quantity;
      } else {
        notFound.push(itemNumber);
      }
    }

    if (addedCount > 0) {
      toast.success(`${addedCount} productos añadidos`);
      setInput("");
      setOpen(false);
    }

    if (notFound.length > 0) {
      toast.warning(`No se encontraron los números: ${notFound.join(", ")}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50 hover:bg-primary/10">
          <Zap className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">Pedido Rápido</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pedido Rápido por Números</DialogTitle>
          <DialogDescription>
            Introduce los números de los platos separados por comas o espacios.
            <br />
            Ejemplo: <code className="bg-muted px-1 rounded">1, 5, 12x2</code> (El 12 dos veces)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Ej: 1, 4, 10x2, 55"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px] text-lg font-mono"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button onClick={handleProcess} disabled={!input.trim()}>
            Añadir a Mesa {activeTableId !== null ? activeTableId : '?'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
