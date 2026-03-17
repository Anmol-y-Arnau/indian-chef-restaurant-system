import { CustomItemDialog } from "@/components/CustomItemDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { HistoryDialog } from "@/components/HistoryDialog";
import { FrequentCustomersDialog } from "@/components/FrequentCustomersDialog";
import { QuickOrderDialog } from "@/components/QuickOrderDialog";
import { MenuCardMemo } from "@/components/MenuCardMemo";
import { OrderPanel } from "@/components/OrderPanel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { CATEGORIES, MENU_ITEMS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Menu, Search, ShoppingBag, ChefHat, BarChart3, Flame } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useHaptic } from "@/hooks/useHaptic";
import { useLocation } from "wouter";
import KitchenView from "./KitchenView";
import { CustomizationModal } from "@/components/CustomizationModal";
import { MenuDelDiaDialog } from "@/components/MenuDelDiaDialog";
import { TakeawayTimeModal } from "@/components/TakeawayTimeModal";
import type { MenuItem } from "@/lib/types";

export default function Home() {
  const { t, language } = useLanguage();
  const { 
    tables, 
    activeTableId, 
    setActiveTableId, 
    addOrderToTable, 
    getTableTotal 
  } = useRestaurant();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isTablesOpen, setIsTablesOpen] = useState(false);
  const [showHero, setShowHero] = useState(true); // Siempre true en móvil
  const [isKitchenMode, setIsKitchenMode] = useState(false);
  const [customizationItem, setCustomizationItem] = useState<MenuItem | null>(null);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [menuDelDiaItem, setMenuDelDiaItem] = useState<MenuItem | null>(null);
  const [isMenuDelDiaOpen, setIsMenuDelDiaOpen] = useState(false);
  const [isTakeawayTimeModalOpen, setIsTakeawayTimeModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const haptic = useHaptic();

  // Todos los productos pueden ser personalizados
  const canBeCustomized = (item: MenuItem) => {
    return true; // Todos los productos tienen botón de lápiz
  };

  // Función para manejar la adición directa de un item (sin personalización)
  const handleAddItem = (item: MenuItem) => {
    if (activeTableId === null) {
      // Mobile: Open tables drawer
      if (window.innerWidth < 768) {
        setIsTablesOpen(true);
      } else {
        // Desktop: Shake animation
        const sidebar = document.querySelector('.bg-sidebar');
        sidebar?.classList.add('animate-pulse');
        setTimeout(() => sidebar?.classList.remove('animate-pulse'), 500);
      }
      return;
    }

    // Si es menú del día, abrir selector de entrante y bebida directamente
    if (item.category === 'menu_del_dia') {
      setMenuDelDiaItem(item);
      setIsMenuDelDiaOpen(true);
      return;
    }

    // Añadir directamente sin modal
    addOrderToTable(activeTableId, item);
    haptic.light(); // Vibración suave al añadir item
  };

  // Función para manejar la personalización de un item (abrir modal)
  const handleCustomizeItem = (item: MenuItem) => {
    if (activeTableId === null) {
      // Mobile: Open tables drawer
      if (window.innerWidth < 768) {
        setIsTablesOpen(true);
      } else {
        // Desktop: Shake animation
        const sidebar = document.querySelector('.bg-sidebar');
        sidebar?.classList.add('animate-pulse');
        setTimeout(() => sidebar?.classList.remove('animate-pulse'), 500);
      }
      return;
    }

    // Si es menú del día, abrir diálogo especial
    if (item.category === 'menu_del_dia') {
      setMenuDelDiaItem(item);
      setIsMenuDelDiaOpen(true);
    } else {
      // Abrir modal de personalización normal
      setCustomizationItem(item);
      setIsCustomizationOpen(true);
    }
  };

  // Función para confirmar la personalización
  const handleConfirmCustomization = (spiceLevel: string, notes: string, quantity: number, customPrice?: number) => {
    if (customizationItem && activeTableId !== null) {
      // Si hay precio personalizado, crear copia del item con nuevo precio
      const itemToAdd = customPrice !== undefined
        ? { ...customizationItem, price: customPrice }
        : customizationItem;
      // Añadir la cantidad especificada
      for (let i = 0; i < quantity; i++) {
        addOrderToTable(activeTableId, itemToAdd, { spiceLevel, notes });
      }
    }
    setIsCustomizationOpen(false);
    setCustomizationItem(null);
  };

  // Función para confirmar el menú del día
  const handleConfirmMenuDelDia = (item: MenuItem, customName: string, notes?: string) => {
    if (activeTableId !== null) {
      // Crear una copia del item con el nombre y notas
      const customizedItem = {
        ...item,
        name: customName,
        notes: notes || ''
      };
      addOrderToTable(activeTableId, customizedItem);
    }
    setIsMenuDelDiaOpen(false);
    setMenuDelDiaItem(null);
  };

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If searching, ignore category filter. If not searching, apply category filter.
    if (searchQuery.trim() !== "") {
      return matchesSearch;
    }
    
    return item.category === activeCategory;
  });

  const activeTable = tables.find(t => t.id === activeTableId);
  const currentTotal = activeTableId ? getTableTotal(activeTableId) : 0;
  const itemCount = activeTable?.orders.length || 0;

  // Hero siempre visible en móvil, se oculta en desktop al hacer scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      // Solo ocultar hero en desktop (>= 768px)
      if (window.innerWidth >= 768) {
        setShowHero(scrollTop < 50);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Si está en modo cocina, mostrar KitchenView
  if (isKitchenMode) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsKitchenMode(false)}
          className="fixed top-2 right-2 z-[60] bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition-all backdrop-blur-sm"
          title="Volver al Menú"
        >
          <Menu className="w-3 h-3" />
          <span className="hidden sm:inline">Menú</span>
        </button>
        <button
          onClick={() => window.open('/cocina-tandoor', '_blank')}
          className="fixed top-2 right-20 z-[60] bg-orange-800/70 hover:bg-orange-700/90 text-orange-200 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition-all backdrop-blur-sm"
          title="Vista Tandoor"
        >
          <Flame className="w-3 h-3" />
          <span>Tandoor</span>
        </button>
        <KitchenView />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-background text-foreground">
      
      {/* MOBILE HEADER - COMPACT */}
      <div className="md:hidden h-14 border-b border-border bg-card/95 backdrop-blur-md flex items-center justify-between px-3 z-30 shrink-0 sticky top-0">
        <div className="flex items-center gap-2">
          <Sheet open={isTablesOpen} onOpenChange={setIsTablesOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" id="mobile-menu-trigger">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 bg-sidebar border-r border-border">
              <SheetTitle className="sr-only">Menú de mesas</SheetTitle>
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center p-2 glow-magenta">
                    <img src="https://files.manuscdn.com/user_upload_by_module/session_file/99644924/SnzQqCrezlPndEim.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="font-heading text-xl gradient-text">Indian Chef</h2>
                    <span className="text-xs text-muted-foreground">v9.7.5</span>
                  </div>
                </div>
                <ScrollArea className="flex-1 -mx-2 px-2">
                  <div className="grid grid-cols-3 gap-3">
                    {tables.filter(t => t.id !== 'TAKEAWAY').map(table => (
                      <button
                        key={table.id}
                        onClick={() => {
                          setActiveTableId(table.id);
                          setIsTablesOpen(false);
                          haptic.selection(); // Vibración al cambiar mesa
                        }}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative border",
                          activeTableId === table.id 
                            ? "gradient-primary text-primary-foreground border-transparent glow-magenta scale-105" 
                            : "bg-card hover:bg-accent hover:text-accent-foreground border-border",
                          table.status === 'occupied' && activeTableId !== table.id && "border-secondary border-2"
                        )}
                      >
                        <span className="font-heading text-lg">{table.id}</span>
                        {table.orders.length > 0 && (
                          <div className={cn(
                            "absolute top-1 right-1 w-2 h-2 rounded-full",
                            table.status === 'occupied' ? "bg-secondary" : "bg-accent"
                          )} />
                        )}
                      </button>
                   ))}
                    
                    {/* Botón TAKEAWAY dentro del grid */}
                    <button
                      onClick={() => {
                        setIsTakeawayTimeModalOpen(true);
                        setIsTablesOpen(false);
                      }}
                      className="col-span-3 gradient-primary hover:glow-magenta text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                      <span className="text-2xl">🥡</span>
                      <span className="font-bold text-base">TAKE AWAY</span>
                    </button>
                  </div>
                </ScrollArea>
                
                {/* Botones Cocina */}
                <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setIsKitchenMode(true);
                      setIsTablesOpen(false);
                    }}
                    className="w-full gradient-accent hover:glow-orange text-white rounded-lg py-4 px-4 flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <ChefHat className="w-6 h-6" />
                    <span className="font-bold text-lg">Modo Cocina</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsTablesOpen(false);
                      window.open('/cocina-tandoor', '_blank');
                    }}
                    className="w-full bg-orange-900/70 hover:bg-orange-800 text-orange-200 hover:text-white rounded-lg py-3 px-4 flex items-center justify-center gap-3 transition-all active:scale-95 border border-orange-700/50"
                  >
                    <Flame className="w-5 h-5" />
                    <span className="font-bold">Vista Tandoor</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="font-heading text-sm text-primary truncate max-w-[80px]">
            {activeTableId === 'TAKEAWAY' ? 'TAKEAWAY' : activeTableId !== null ? `${t('table')} ${activeTableId}` : t('no_table')}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <div className="relative w-28">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3" />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              className="w-full bg-muted/50 border border-border rounded-full py-1.5 pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.href = "/stats"}
            className="rounded-full w-10 h-10 border-primary/50 text-primary hover:bg-primary/10"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
          <HistoryDialog />
          <FrequentCustomersDialog />
          <LanguageSwitcher />
        </div>
      </div>

      {/* DESKTOP SIDEBAR - TABLES */}
      <div className="hidden md:flex w-24 lg:w-32 flex-shrink-0 border-r border-border bg-sidebar flex-col items-center py-6 gap-6 z-20 shadow-xl h-full">
        <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center p-2 glow-magenta">
          <img src="https://files.manuscdn.com/user_upload_by_module/session_file/99644924/SnzQqCrezlPndEim.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        
        <ScrollArea className="flex-1 w-full px-2 min-h-0">
          <div className="flex flex-col gap-4 items-center pb-4">
            {tables.filter(t => t.id !== 'TAKEAWAY').map(table => (
              <button
                key={table.id}
                onClick={() => {
                  setActiveTableId(table.id);
                  haptic.selection(); // Vibración al cambiar mesa
                }}
                className={cn(
                  "w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative",
                  activeTableId === table.id 
                    ? "gradient-primary text-primary-foreground glow-magenta scale-110" 
                    : "bg-card hover:bg-accent hover:text-accent-foreground border border-border",
                  table.status === 'occupied' && activeTableId !== table.id && "border-l-4 border-l-secondary"
                )}
              >
                <span className="font-heading text-xl">{table.id}</span>
                {table.orders.length > 0 && (
                  <div className={cn(
                    "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                    table.status === 'occupied' ? "bg-secondary" : "bg-accent"
                  )} />
                )}
              </button>
            ))}
            
            {/* TAKEAWAY Button */}
            <button
              onClick={() => {
                if (activeTableId !== 'TAKEAWAY') {
                  setIsTakeawayTimeModalOpen(true);
                } else {
                  setActiveTableId('TAKEAWAY');
                  haptic.selection(); // Vibración al seleccionar TAKEAWAY
                }
              }}
              className={cn(
                "w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative text-xs font-bold",
                activeTableId === 'TAKEAWAY' 
                  ? "gradient-primary text-primary-foreground glow-magenta scale-110" 
                  : "bg-card hover:bg-accent hover:text-accent-foreground border border-border border-2 border-dashed"
              )}
            >
              <span className="font-heading">TAKE</span>
              <span className="font-heading">AWAY</span>
            </button>
          </div>
        </ScrollArea>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {/* Hero Header - Only visible on mobile at top */}
          <div className={cn(
            "md:h-48 w-full relative overflow-hidden transition-all duration-300",
            "h-32 md:h-48", // Siempre visible en móvil
            !showHero && "md:h-0" // Solo se oculta en desktop
          )}>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/session_file/99644924/BvOCZAJtZCiJBJVF.jpg" 
              alt="Spices" 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-8 z-20 flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl gradient-primary flex items-center justify-center p-2 glow-magenta">
                <img src="https://files.manuscdn.com/user_upload_by_module/session_file/99644924/SnzQqCrezlPndEim.png" alt="Indian Chef Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2 md:gap-3">
                  <h1 className="text-2xl md:text-5xl font-heading gradient-text drop-shadow-lg">
                    {t('app_title')}
                  </h1>
                  <span className="text-xs md:text-sm text-muted-foreground font-mono mt-1 md:mt-2">v9.7.5</span>
                </div>
                <p className="text-muted-foreground text-xs md:text-lg max-w-md hidden md:block">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            
            {/* Search Bar - Desktop only */}
            <div className="hidden md:flex absolute bottom-6 right-8 z-20 items-center gap-2">
              <Button
                onClick={() => setIsKitchenMode(true)}
                variant="outline"
                size="sm"
                className="gradient-accent text-white border-transparent hover:glow-orange backdrop-blur-md transition-all shadow-lg"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                {t('kitchen_mode') || 'Modo Cocina'}
              </Button>
              <Button
                onClick={() => window.open('/cocina-tandoor', '_blank')}
                variant="outline"
                size="sm"
                className="bg-orange-900/60 hover:bg-orange-800 text-orange-200 hover:text-white border-orange-700/50 backdrop-blur-md transition-all"
              >
                <Flame className="w-4 h-4 mr-2" />
                Tandoor
              </Button>
              <LanguageSwitcher />
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.location.href = "/stats"}
                className="rounded-full w-10 h-10 border-primary/50 text-primary hover:bg-primary/10"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
              <HistoryDialog />
              <FrequentCustomersDialog />
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input 
                  type="text" 
                  placeholder={t('search_placeholder')} 
                  className="w-full bg-black/50 backdrop-blur-md border border-white/20 rounded-full py-2 pl-10 pr-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Categories & Menu Grid */}
          <div className="flex flex-col bg-background">
            <Tabs defaultValue={CATEGORIES[0].id} value={activeCategory} onValueChange={(value) => {
              setActiveCategory(value);
              haptic.selection(); // Vibración al cambiar categoría
            }} className="flex flex-col">
              {/* Categories - Sticky on mobile */}
              <div className="sticky top-0 md:relative px-4 md:px-6 py-3 md:py-4 border-b border-border bg-background/95 backdrop-blur-md z-30">
                <div className="w-full overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                  <TabsList className="bg-transparent h-auto p-0 gap-2 justify-start w-max flex">
                    {CATEGORIES.map(category => (
                      <TabsTrigger 
                        key={category.id} 
                        value={category.id}
                        onClick={() => setSearchQuery("")}
                        className="data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:border-transparent data-[state=active]:glow-magenta rounded-full px-4 py-1.5 md:px-6 md:py-2 border border-border transition-all duration-300 text-sm md:text-base shrink-0"
                      >
                        <span className="mr-2 text-base md:text-lg">{category.icon}</span>
                        {t(`categories.${category.id}`)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </div>

              {/* Menu Grid - Scrollable */}
              <div className="bg-background">
                <div className="p-4 md:p-6 pb-24 md:pb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {filteredItems.map(item => (
                      <MenuCardMemo 
                        key={item.id} 
                        item={item} 
                        onAdd={() => handleAddItem(item)}
                        onCustomize={() => handleCustomizeItem(item)}
                        showCustomizeButton={canBeCustomized(item)}
                      />
                    ))}
                    
                    {/* Custom Item Button - Al final */}
                    <div className="h-full min-h-[100px]">
                      <CustomItemDialog />
                    </div>
                  </div>
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* DESKTOP RIGHT SIDEBAR - ORDER PANEL */}
      <div className="hidden md:block w-80 lg:w-96 flex-shrink-0 border-l border-border bg-card z-20 shadow-2xl">
        <OrderPanel />
      </div>

      {/* MOBILE BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{t('total')} {t('table')} {activeTableId ?? '-'}</span>
          <span className="text-xl font-bold text-primary">{currentTotal.toFixed(2)}€</span>
        </div>
        
        <div className="flex gap-2">
          <QuickOrderDialog />
          
          <Sheet open={isOrderOpen} onOpenChange={setIsOrderOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="gap-2 rounded-full px-6">
                <ShoppingBag className="w-5 h-5" />
                {t('view_order')}
                {itemCount > 0 && (
                  <span className="bg-white text-primary text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                    {itemCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-[2rem]">
            <SheetTitle className="sr-only">Panel de pedido</SheetTitle>
            <div className="h-full pt-4">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-4" />
              <button 
                id="close-mobile-order-panel" 
                className="hidden" 
                onClick={() => setIsOrderOpen(false)}
              />
              <OrderPanel />
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>

      {/* Customization Modal */}
      {customizationItem && (
        <CustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => {
            setIsCustomizationOpen(false);
            setCustomizationItem(null);
          }}
          onConfirm={handleConfirmCustomization}
          itemName={customizationItem.name}
          itemPrice={customizationItem.price}
        />
      )}

      {/* Menu del Dia Dialog */}
      {menuDelDiaItem && (
        <MenuDelDiaDialog
          isOpen={isMenuDelDiaOpen}
          onClose={() => {
            setIsMenuDelDiaOpen(false);
            setMenuDelDiaItem(null);
          }}
          onConfirm={handleConfirmMenuDelDia}
          menuItem={menuDelDiaItem}
        />
      )}

      {/* Takeaway Time Modal */}
      <TakeawayTimeModal
        isOpen={isTakeawayTimeModalOpen}
        onClose={() => setIsTakeawayTimeModalOpen(false)}
        onConfirm={(minutes) => {
          // Set pickup time for TAKEAWAY table
          const deadline = Date.now() + (minutes * 60 * 1000);
          // TODO: Store pickupTime and pickupDeadline in table state
          setActiveTableId('TAKEAWAY');
        }}
      />
    </div>
  );
}
