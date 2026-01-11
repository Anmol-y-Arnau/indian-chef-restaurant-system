import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flame } from 'lucide-react';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (spiceLevel: string, notes: string) => void;
  itemName: string;
}

const SPICE_LEVELS = [
  { value: '-', label: 'No Picante', color: 'bg-green-500 hover:bg-green-600' },
  { value: '+-', label: 'Toque Picante', color: 'bg-yellow-500 hover:bg-yellow-600' },
  { value: '+', label: 'Picante', color: 'bg-orange-500 hover:bg-orange-600' },
  { value: '++', label: 'Muy Picante', color: 'bg-red-500 hover:bg-red-600' },
];

export function CustomizationModal({ isOpen, onClose, onConfirm, itemName }: CustomizationModalProps) {
  const [spiceLevel, setSpiceLevel] = useState<string>('+-');
  const [notes, setNotes] = useState<string>('');

  const handleConfirm = () => {
    onConfirm(spiceLevel, notes);
    // Reset state
    setSpiceLevel('+-');
    setNotes('');
  };

  const handleCancel = () => {
    onClose();
    // Reset state
    setSpiceLevel('+-');
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            Personalizar: {itemName}
          </DialogTitle>
          <DialogDescription>
            Selecciona el nivel de picante y añade observaciones si es necesario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Spice Level Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Nivel de Picante</label>
            <div className="grid grid-cols-2 gap-2">
              {SPICE_LEVELS.map((level) => (
                <Button
                  key={level.value}
                  type="button"
                  variant={spiceLevel === level.value ? 'default' : 'outline'}
                  className={`h-auto py-3 ${
                    spiceLevel === level.value
                      ? `${level.color} text-white`
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSpiceLevel(level.value)}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl font-bold">{level.value}</span>
                    <span className="text-xs">{level.label}</span>
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
              rows={3}
              className="resize-none"
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
