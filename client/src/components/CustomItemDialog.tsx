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
import { useRestaurant } from "@/contexts/RestaurantContext";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function CustomItemDialog() {
  const { activeTableId, addOrderToTable } = useRestaurant();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Varios");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");

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
      category: 'drinks', // Default category for custom items
      image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1974&auto=format&fit=crop'
    }, quantityNum);

    // toast.success("Producto añadido"); // Removed because context already shows toast
    setOpen(false);
    setName("Varios");
    setPrice("");
    setQuantity("1");
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Producto Personalizado</DialogTitle>
          <DialogDescription>
            Introduce el nombre y precio del producto que quieres añadir a la mesa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
          <DialogFooter>
            <Button type="submit">Añadir a la Mesa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
