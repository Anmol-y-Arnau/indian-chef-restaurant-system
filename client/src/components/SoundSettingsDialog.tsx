import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { CATEGORIES, MENU_ITEMS } from '@/lib/data';

interface SoundSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Categorías que pueden tener sonido (solo comida, no bebidas)
const SOUND_CATEGORIES = ['starters', 'salads', 'tandoor', 'veg_curry', 'chicken_curry', 'fish_prawn_curry', 'lamb_curry', 'biryani', 'sides', 'desserts'];

export function SoundSettingsDialog({ isOpen, onClose }: SoundSettingsDialogProps) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set(SOUND_CATEGORIES));
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Cargar configuración desde localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('kitchenSoundConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setSoundEnabled(config.soundEnabled ?? true);
        setSelectedCategories(new Set(config.selectedCategories ?? SOUND_CATEGORIES));
        setSelectedItems(new Set(config.selectedItems ?? []));
      } catch (e) {
        console.error('Error loading sound config:', e);
      }
    } else {
      // Por defecto, todos los items seleccionados
      const allFoodItems = MENU_ITEMS
        .filter(item => SOUND_CATEGORIES.includes(item.category))
        .map(item => item.id);
      setSelectedItems(new Set(allFoodItems));
    }
  }, []);

  // Guardar configuración en localStorage
  const saveConfig = () => {
    const config = {
      soundEnabled,
      selectedCategories: Array.from(selectedCategories),
      selectedItems: Array.from(selectedItems),
    };
    localStorage.setItem('kitchenSoundConfig', JSON.stringify(config));
  };

  // Toggle categoría completa
  const toggleCategory = (categoryId: string) => {
    const newSelectedCategories = new Set(selectedCategories);
    const newSelectedItems = new Set(selectedItems);
    
    const categoryItems = MENU_ITEMS.filter(item => item.category === categoryId);
    
    if (selectedCategories.has(categoryId)) {
      // Desmarcar categoría y todos sus items
      newSelectedCategories.delete(categoryId);
      categoryItems.forEach(item => newSelectedItems.delete(item.id));
    } else {
      // Marcar categoría y todos sus items
      newSelectedCategories.add(categoryId);
      categoryItems.forEach(item => newSelectedItems.add(item.id));
    }
    
    setSelectedCategories(newSelectedCategories);
    setSelectedItems(newSelectedItems);
  };

  // Toggle item individual
  const toggleItem = (itemId: string, categoryId: string) => {
    const newSelectedItems = new Set(selectedItems);
    
    if (selectedItems.has(itemId)) {
      newSelectedItems.delete(itemId);
      // Si se desmarca un item, desmarcar también la categoría
      setSelectedCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(categoryId);
        return newSet;
      });
    } else {
      newSelectedItems.add(itemId);
      // Verificar si todos los items de la categoría están seleccionados
      const categoryItems = MENU_ITEMS.filter(item => item.category === categoryId);
      const allSelected = categoryItems.every(item => 
        item.id === itemId || newSelectedItems.has(item.id)
      );
      if (allSelected) {
        setSelectedCategories(prev => new Set(prev).add(categoryId));
      }
    }
    
    setSelectedItems(newSelectedItems);
  };

  // Expandir/colapsar categoría
  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (expandedCategories.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Probar sonido
  const playTestSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.8, audioContext.currentTime);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
    
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.type = 'square';
      oscillator2.frequency.setValueAtTime(1400, audioContext.currentTime);
      gainNode2.gain.setValueAtTime(0.8, audioContext.currentTime);
      
      oscillator2.start();
      oscillator2.stop(audioContext.currentTime + 0.2);
    }, 250);
  };

  const handleSave = () => {
    saveConfig();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            Configuración de Sonido
          </DialogTitle>
          <DialogDescription>
            Personaliza qué pedidos activan la notificación sonora en la cocina
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Toggle Global */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Sonido Activado</Label>
              <p className="text-sm text-muted-foreground">
                Activar o desactivar todas las notificaciones sonoras
              </p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>

          {/* Botón de prueba */}
          <Button
            variant="outline"
            onClick={playTestSound}
            className="w-full"
            disabled={!soundEnabled}
          >
            <Volume2 className="w-4 h-4 mr-2" />
            Probar Sonido
          </Button>

          {/* Lista de categorías */}
          <div className="flex-1 overflow-hidden">
            <Label className="text-sm font-semibold mb-2 block">
              Seleccionar por Categoría o Plato Individual
            </Label>
            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-4 space-y-2">
                {CATEGORIES.filter(cat => SOUND_CATEGORIES.includes(cat.id)).map(category => {
                  const categoryItems = MENU_ITEMS.filter(item => item.category === category.id);
                  const isExpanded = expandedCategories.has(category.id);
                  const isCategorySelected = selectedCategories.has(category.id);
                  
                  return (
                    <div key={category.id} className="border rounded-lg overflow-hidden">
                      {/* Header de categoría */}
                      <div className="flex items-center gap-2 p-3 bg-muted/50 hover:bg-muted transition-colors">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleExpanded(category.id)}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </Button>
                        
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="checkbox"
                            checked={isCategorySelected}
                            onChange={() => toggleCategory(category.id)}
                            disabled={!soundEnabled}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-lg">{category.icon}</span>
                          <span className="font-medium">{category.label}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            ({categoryItems.length} platos)
                          </span>
                        </div>
                      </div>
                      
                      {/* Items de la categoría */}
                      {isExpanded && (
                        <div className="p-2 space-y-1 bg-background">
                          {categoryItems.map(item => (
                            <div
                              key={item.id}
                              className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleItem(item.id, category.id)}
                                disabled={!soundEnabled}
                                className="w-4 h-4 rounded border-gray-300 ml-8"
                              />
                              <span className="text-sm">
                                {item.number}. {item.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
