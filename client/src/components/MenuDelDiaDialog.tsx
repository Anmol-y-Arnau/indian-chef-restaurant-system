import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MenuItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuDelDiaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: MenuItem, customName: string, notes?: string) => void;
  menuItem: MenuItem;
}

const ENTRANTES = [
  { id: 'samosa', name: 'Samosa', name_en: 'Samosa' },
  { id: 'veg_pakora', name: 'Veg Pakora', name_en: 'Veg Pakora' },
  { id: 'chicken_pakora', name: 'Chicken Pakora', name_en: 'Chicken Pakora' },
];

const BEBIDAS = [
  { id: 'coca_cola', name: 'Coca Cola', name_en: 'Coca Cola' },
  { id: 'fanta', name: 'Fanta Naranja', name_en: 'Fanta Orange' },
  { id: 'sprite', name: 'Sprite', name_en: 'Sprite' },
  { id: 'agua', name: 'Agua', name_en: 'Water' },
];

export function MenuDelDiaDialog({ isOpen, onClose, onConfirm, menuItem }: MenuDelDiaDialogProps) {
  const { t, language } = useLanguage();
  const [selectedEntrante, setSelectedEntrante] = useState<string>(ENTRANTES[0].id);
  const [selectedBebida, setSelectedBebida] = useState<string>(BEBIDAS[0].id);

  const handleConfirm = () => {
    const entranteObj = ENTRANTES.find(e => e.id === selectedEntrante);
    const bebidaObj = BEBIDAS.find(b => b.id === selectedBebida);
    
    const entranteName = language === 'en' ? entranteObj?.name_en : entranteObj?.name;
    const bebidaName = language === 'en' ? bebidaObj?.name_en : bebidaObj?.name;
    
    // Guardar opciones estructuradas en notes para que se vean en cocina
    const notes = `Entrante: ${entranteName} | Bebida: ${bebidaName}`;
    
    // El customName ahora es solo el nombre del menú, los detalles van en notes
    onConfirm(menuItem, menuItem.name, notes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading text-primary">
            🍽️ {menuItem.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {t('menu_description')}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Selector de Entrante */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">
              {t('selecciona_entrante')}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {ENTRANTES.map(entrante => (
                <button
                  key={entrante.id}
                  onClick={() => setSelectedEntrante(entrante.id)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-left",
                    selectedEntrante === entrante.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  <span className="font-medium">
                    {language === 'en' ? entrante.name_en : entrante.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Plato Principal (fijo) */}
          <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold text-base text-primary">
              {t('plato_principal')}
            </h3>
            <p className="text-sm text-muted-foreground">
              Butter Chicken, Dal Makhni, Jeera Rice, Garlic Naan, {t('ensalada')}
            </p>
          </div>

          {/* Selector de Bebida */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base">
              {t('selecciona_bebida')}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {BEBIDAS.map(bebida => (
                <button
                  key={bebida.id}
                  onClick={() => setSelectedBebida(bebida.id)}
                  className={cn(
                    "p-3 rounded-lg border-2 transition-all text-center",
                    selectedBebida === bebida.id
                      ? "border-primary bg-primary/10 shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  )}
                >
                  <span className="font-medium text-sm">
                    {language === 'en' ? bebida.name_en : bebida.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Nota sobre postre/café */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ {t('postre_cafe_nota')}
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('cancelar')}
          </Button>
          <Button onClick={handleConfirm} className="gap-2">
            {t('confirmar')} - {menuItem.price.toFixed(2)}€
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
