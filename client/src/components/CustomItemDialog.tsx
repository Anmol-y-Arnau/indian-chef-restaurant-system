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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { FrequentCustomItemsSuggestions } from "@/components/FrequentCustomItemsSuggestions";
import { Flame, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SPICE_LEVELS = [
  { value: '', label: 'Sin especificar', icon: '—', color: 'bg-gray-500 hover:bg-gray-600' },
  { value: '-', label: 'No Picante', icon: '-', color: 'bg-green-500 hover:bg-green-600' },
  { value: '+-', label: 'Toque Picante', icon: '+-', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: '+', label: 'Picante', icon: '+', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: '++', label: 'Muy Picante', icon: '++', color: 'bg-red-500 hover:bg-red-600' },
];

export function CustomItemDialog() {
  const { activeTableId, addOrderToTable } = useRestaurant();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Varios");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [spiceLevel, setSpiceLevel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeTableId) {
      toast.error("Selecciona una mesa primero");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Introduce un precio válido");
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast.error("Introduce una cantidad válida");
      return;
    }

    addOrderToTable(activeTableId, {
      id: `custom-${Date.now()}`,
      name: name,
      description: "Producto personalizado",
      price: priceNum,
      category: 'custom' as any, // Categoría especial para platos personalizados (sección Varios en cocina)
      image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1974&auto=format&fit=crop'
    }, { quantity: quantityNum, spiceLevel, notes });

    // toast.success("Producto añadido"); // Removed because context already shows toast
    setOpen(false);
    setName("Varios");
    setPrice("");
    setQuantity("1");
    setSpiceLevel('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-full min-h-[120px] flex flex-col gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5"
        >
          <Plus className="w-8 h-8" />
          <span className="font-heading text-lg">Varios / Personalizado</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flame className="w-4 h-4 text-orange-500" />
            Añadir Producto Personalizado
          </DialogTitle>
          <DialogDescription className="text-xs">
            Introduce el nombre, precio y personalización del producto que quieres añadir a la mesa.
          </DialogDescription>
        </DialogHeader>
        {/* Sugerencias de platos frecuentes */}
        <FrequentCustomItemsSuggestions compact />
        <form onSubmit={handleSubmit} className="grid gap-3 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Precio (€)
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Cantidad
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-10 w-10"
                onClick={() => setQuantity(prev => Math.max(1, parseInt(prev || "0") - 1).toString())}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="text-center"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="h-10 w-10"
                onClick={() => setQuantity(prev => (parseInt(prev || "0") + 1).toString())}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Spice Level Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nivel de Picante (opcional)</Label>
            <div className="grid grid-cols-3 gap-2">
              {SPICE_LEVELS.map((level) => (
                <Button
                  key={level.value}
                  type="button"
                  variant={spiceLevel === level.value ? 'default' : 'outline'}
                  className={`h-auto py-2 ${
                    spiceLevel === level.value
                      ? `${level.color} text-white border-2 border-white shadow-lg`
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSpiceLevel(level.value)}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-2xl font-bold">{level.icon}</span>
                    <span className="text-[9px] font-semibold leading-tight">{level.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Observaciones (opcional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Ej: Sin cebolla, extra salsa, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          <DialogFooter>
            <Button type="submit">Añadir a la Mesa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
