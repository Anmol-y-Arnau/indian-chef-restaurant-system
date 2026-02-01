import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Clock } from "lucide-react";
import { useState } from "react";

interface TakeawayTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => void;
}

export function TakeawayTimeModal({ isOpen, onClose, onConfirm }: TakeawayTimeModalProps) {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const presetTimes = [10, 15, 20, 25, 30, 40, 50, 60];

  const handleConfirm = () => {
    onConfirm(selectedMinutes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Tiempo de Recogida TAKEAWAY
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            ¿En cuántos minutos estará listo el pedido?
          </p>

          {/* Preset Times Grid */}
          <div className="grid grid-cols-4 gap-2">
            {presetTimes.map((minutes) => (
              <Button
                key={minutes}
                variant={selectedMinutes === minutes ? "default" : "outline"}
                className="h-16 flex flex-col items-center justify-center"
                onClick={() => setSelectedMinutes(minutes)}
              >
                <span className="text-2xl font-bold">{minutes}</span>
                <span className="text-xs">min</span>
              </Button>
            ))}
          </div>

          {/* Custom Time Input */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="5"
              max="120"
              value={selectedMinutes}
              onChange={(e) => setSelectedMinutes(Math.max(5, Math.min(120, parseInt(e.target.value) || 15)))}
              className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Minutos personalizados"
            />
            <span className="text-sm text-muted-foreground">minutos</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
