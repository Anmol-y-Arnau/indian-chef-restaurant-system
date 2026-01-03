import { MenuCard } from "@/components/MenuCard";
import { OrderPanel } from "@/components/OrderPanel";
import { TableCard } from "@/components/TableCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { CATEGORIES, MENU_ITEMS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
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

  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-screen w-full flex overflow-hidden bg-background text-foreground">
      {/* Left Sidebar - Navigation & Tables */}
      <div className="w-24 md:w-32 flex-shrink-0 border-r border-border bg-sidebar flex flex-col items-center py-6 gap-6 z-20 shadow-xl">
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

      {/* Main Content - Menu */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Hero Header */}
        <div className="h-48 w-full relative flex-shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
          <img 
            src="/images/hero-bg.jpg" 
            alt="Spices" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-6 left-8 z-20">
            <h1 className="text-4xl md:text-5xl font-heading text-primary mb-2 drop-shadow-lg">
              Indian Chef
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              Sistema de Gestión de Restaurante
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="absolute bottom-6 right-8 z-20 w-64 md:w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar plato..." 
                className="w-full bg-black/50 backdrop-blur-md border border-white/20 rounded-full py-2 pl-10 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Categories & Menu Grid */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background/95 backdrop-blur-sm">
          <Tabs defaultValue={CATEGORIES[0].id} value={activeCategory} onValueChange={setActiveCategory} className="flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-border overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-2 justify-start w-max">
                {CATEGORIES.map(category => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 py-2 border border-border data-[state=active]:border-primary transition-all duration-300"
                  >
                    <span className="mr-2 text-lg">{category.icon}</span>
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden relative p-6">
              <ScrollArea className="h-full pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                  {filteredItems.map(item => (
                    <MenuCard 
                      key={item.id} 
                      item={item} 
                      onAdd={() => {
                        if (activeTableId) {
                          addOrderToTable(activeTableId, item);
                        } else {
                          // Shake animation or toast to select table first
                          const sidebar = document.querySelector('.bg-sidebar');
                          sidebar?.classList.add('animate-pulse');
                          setTimeout(() => sidebar?.classList.remove('animate-pulse'), 500);
                        }
                      }} 
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Right Sidebar - Order Panel */}
      <div className="w-80 md:w-96 flex-shrink-0 border-l border-border bg-card z-20 shadow-2xl">
        <OrderPanel />
      </div>
    </div>
  );
}
