import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flame, Plus, Minus } from 'lucide-react';
import { useHaptic } from '@/hooks/useHaptic';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (spiceLevel: string, notes: string, quantity: number) => void;
  itemName: string;
}

const SPICE_LEVELS = [
  { value: '', label: 'Sin especificar', icon: '—', color: 'bg-gray-500 hover:bg-gray-600' },
  { value: '-', label: 'No Picante', icon: '-', color: 'bg-green-500 hover:bg-green-600' },
  { value: '+-', label: 'Toque Picante', icon: '+-', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: '+', label: 'Picante', icon: '+', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: '++', label: 'Muy Picante', icon: '++', color: 'bg-red-500 hover:bg-red-600' },
];

export function CustomizationModal({ isOpen, onClose, onConfirm, itemName }: CustomizationModalProps) {
  const [spiceLevel, setSpiceLevel] = useState<string>(''); // Default: Sin especificar
  const [notes, setNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const haptic = useHaptic();

  const handleConfirm = () => {
    onConfirm(spiceLevel, notes, quantity);
    haptic.light(); // Vibración al confirmar personalización
    // Reset state
    setSpiceLevel(''); // Reset to "Sin especificar"
    setNotes('');
    setQuantity(1);
  };

  const handleCancel = () => {
    onClose();
    // Reset state
    setSpiceLevel(''); // Reset to "Sin especificar"
    setNotes('');
    setQuantity(1);
  };

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
