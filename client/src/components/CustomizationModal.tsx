import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Flame, Plus, Minus, Euro } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (spiceLevel: string, notes: string, quantity: number, customPrice?: number) => void;
  itemName: string;
  itemPrice?: number;
}

const SPICE_LEVELS = [
  { value: '', label: 'Sin especificar', icon: '—', color: 'bg-gray-500 hover:bg-gray-600' },
  { value: '-', label: 'No Picante', icon: '-', color: 'bg-green-500 hover:bg-green-600' },
  { value: '+-', label: 'Toque Picante', icon: '+-', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: '+', label: 'Picante', icon: '+', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: '++', label: 'Muy Picante', icon: '++', color: 'bg-red-500 hover:bg-red-600' },
];

export function CustomizationModal({ isOpen, onClose, onConfirm, itemName, itemPrice }: CustomizationModalProps) {
  const [spiceLevel, setSpiceLevel] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [priceInput, setPriceInput] = useState<string>('');
  const haptic = useHaptic();

  // Reset price input when modal opens with a new item
  useEffect(() => {
    if (isOpen) {
      setPriceInput(itemPrice !== undefined ? itemPrice.toFixed(2) : '');
    }
  }, [isOpen, itemPrice]);

  const handleConfirm = () => {
    const parsedPrice = parseFloat(priceInput.replace(',', '.'));
    const customPrice = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : undefined;
    onConfirm(spiceLevel, notes, quantity, customPrice);
    haptic.light();
    // Reset state
    setSpiceLevel('');
    setNotes('');
    setQuantity(1);
    setPriceInput('');
  };

  const handleCancel = () => {
    onClose();
    // Reset state
    setSpiceLevel('');
    setNotes('');
    setQuantity(1);
    setPriceInput('');
  };

  const parsedPrice = parseFloat(priceInput.replace(',', '.'));
  const isPriceModified = itemPrice !== undefined && !isNaN(parsedPrice) && parsedPrice !== itemPrice;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Flame className="w-4 h-4 text-orange-500" />
            Personalizar: {itemName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Selecciona el nivel de picante y añade observaciones si es necesario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quantity Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cantidad</label>
            <div className="flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-2xl font-bold min-w-[50px] text-center">{quantity}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Price Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5 text-primary" />
              Precio unitario
              {isPriceModified && (
                <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                  Modificado
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="number"
                  min="0"
                  step="0.10"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="pr-8 text-lg font-bold text-primary"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">€</span>
              </div>
              {isPriceModified && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs shrink-0"
                  onClick={() => setPriceInput(itemPrice!.toFixed(2))}
                >
                  Restablecer
                </Button>
              )}
            </div>
            {isPriceModified && itemPrice !== undefined && (
              <p className="text-xs text-muted-foreground">
                Precio original: <span className="line-through">{itemPrice.toFixed(2)}€</span>
                {' → '}
                <span className="text-primary font-semibold">{parsedPrice.toFixed(2)}€</span>
              </p>
            )}
          </div>

          {/* Spice Level Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nivel de Picante</label>
            <div className="grid grid-cols-2 gap-2">
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
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl font-bold">{level.icon}</span>
                    <span className="text-[10px] font-semibold">{level.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Observaciones (opcional)
            </label>
            <Textarea
              id="notes"
              placeholder="Ej: Sin cebolla, extra salsa, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-primary">
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
