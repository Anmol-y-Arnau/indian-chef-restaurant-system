import { CustomItemDialog } from "@/components/CustomItemDialog";
import { HistoryDialog } from "@/components/HistoryDialog";
import { MenuCard } from "@/components/MenuCard";
import { OrderPanel } from "@/components/OrderPanel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { CATEGORIES, MENU_ITEMS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function Home() {
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

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-background text-foreground">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 z-30 shrink-0">
        <Sheet open={isTablesOpen} onOpenChange={setIsTablesOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" id="mobile-menu-trigger">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0 bg-sidebar border-r border-border">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary p-1">
                  <img src="/images/chef-icon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="font-heading text-xl text-primary">Indian Chef</h2>
              </div>
              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="grid grid-cols-3 gap-3">
                  {tables.map(table => (
                    <button
                      key={table.id}
                      onClick={() => {
                        setActiveTableId(table.id);
                        setIsTablesOpen(false);
                      }}
                      className={cn(
                        "aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-300 relative border",
                        activeTableId === table.id 
                          ? "bg-primary text-primary-foreground border-primary shadow-lg scale-105" 
                          : "bg-card hover:bg-accent hover:text-accent-foreground border-border",
                        table.status === 'occupied' && activeTableId !== table.id && "border-secondary border-2"
                      )}
                    >
                      <span className="font-heading text-lg">{table.id}</span>
                      {table.status !== 'free' && (
                        <div className={cn(
                          "absolute top-1 right-1 w-2 h-2 rounded-full",
                          table.status === 'occupied' ? "bg-secondary" : "bg-accent"
                        )} />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>

        <div className="font-heading text-lg text-primary truncate max-w-[150px]">
          {activeTableId !== null ? `Mesa ${activeTableId}` : "Sin Mesa"}
        </div>

        <div className="w-10" /> {/* Spacer for balance */}
      </div>

      {/* DESKTOP SIDEBAR - TABLES */}
      <div className="hidden md:flex w-24 lg:w-32 flex-shrink-0 border-r border-border bg-sidebar flex-col items-center py-6 gap-6 z-20 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary p-1">
          <img src="/images/chef-icon.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        
        <ScrollArea className="flex-1 w-full px-2">
          <div className="flex flex-col gap-4 items-center pb-4">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => setActiveTableId(table.id)}
                className={cn(
                  "w-16 h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative",
                  activeTableId === table.id 
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,165,0,0.5)] scale-110" 
                    : "bg-card hover:bg-accent hover:text-accent-foreground border border-border",
                  table.status === 'occupied' && activeTableId !== table.id && "border-l-4 border-l-secondary"
                )}
              >
                <span className="font-heading text-xl">{table.id}</span>
                {table.status !== 'free' && (
                  <div className={cn(
                    "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                    table.status === 'occupied' ? "bg-secondary" : "bg-accent"
                  )} />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Hero Header - Responsive Height */}
        <div className="h-32 md:h-48 w-full relative flex-shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
          <img 
            src="/images/hero-bg.jpg" 
            alt="Spices" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-8 z-20">
            <h1 className="text-2xl md:text-5xl font-heading text-primary mb-1 md:mb-2 drop-shadow-lg">
              Indian Chef
            </h1>
            <p className="text-muted-foreground text-xs md:text-lg max-w-md hidden md:block">
              Sistema de Gestión de Restaurante
            </p>
          </div>
          
          {/* Search Bar - Responsive */}
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 z-20 flex items-center gap-2">
            <HistoryDialog />
            <div className="relative w-32 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3 md:w-4 md:h-4" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="w-full bg-black/50 backdrop-blur-md border border-white/20 rounded-full py-1.5 md:py-2 pl-8 md:pl-10 pr-4 text-xs md:text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Categories & Menu Grid */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background/95 backdrop-blur-sm">
          <Tabs defaultValue={CATEGORIES[0].id} value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col h-full">
            {/* Categories - Horizontal Scroll */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border shrink-0">
              <div className="w-full overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                <TabsList className="bg-transparent h-auto p-0 gap-2 justify-start w-max flex">
                  {CATEGORIES.map(category => (
                    <TabsTrigger 
                      key={category.id} 
                      value={category.id}
                      onClick={() => setSearchQuery("")} // Clear search when picking a category
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-4 py-1.5 md:px-6 md:py-2 border border-border data-[state=active]:border-primary transition-all duration-300 text-sm md:text-base shrink-0"
                    >
                      <span className="mr-2 text-base md:text-lg">{category.icon}</span>
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </div>

            {/* Menu Grid - Scrollable */}
            <div className="flex-1 overflow-hidden relative bg-background">
              <ScrollArea className="h-full">
                <div className="p-4 md:p-6 pb-24 md:pb-20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {/* Custom Item Button */}
                    <div className="h-full min-h-[100px]">
                      <CustomItemDialog />
                    </div>

                    {filteredItems.map(item => (
                      <MenuCard 
                        key={item.id} 
                        item={item} 
                        onAdd={() => {
                          if (activeTableId !== null) {
                            addOrderToTable(activeTableId, item);
                          } else {
                            // Mobile: Open tables drawer
                            if (window.innerWidth < 768) {
                              setIsTablesOpen(true);
                            } else {
                              // Desktop: Shake animation
                              const sidebar = document.querySelector('.bg-sidebar');
                              sidebar?.classList.add('animate-pulse');
                              setTimeout(() => sidebar?.classList.remove('animate-pulse'), 500);
                            }
                          }
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </div>

      {/* DESKTOP RIGHT SIDEBAR - ORDER PANEL */}
      <div className="hidden md:block w-80 lg:w-96 flex-shrink-0 border-l border-border bg-card z-20 shadow-2xl">
        <OrderPanel />
      </div>

      {/* MOBILE BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40 flex items-center justify-between shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Total Mesa {activeTableId ?? '-'}</span>
          <span className="text-xl font-bold text-primary">{currentTotal.toFixed(2)}€</span>
        </div>
        
        <Sheet open={isOrderOpen} onOpenChange={setIsOrderOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="gap-2 rounded-full px-6">
              <ShoppingBag className="w-5 h-5" />
              Ver Pedido
              {itemCount > 0 && (
                <span className="bg-white text-primary text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                  {itemCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-[2rem]">
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
  );
}
