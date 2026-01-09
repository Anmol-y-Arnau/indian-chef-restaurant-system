import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Flame, Leaf } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface MenuCardProps {
  item: MenuItem;
  onAdd: () => void;
}

export function MenuCard({ item, onAdd }: MenuCardProps) {
  const { language } = useLanguage();

  const displayName = language === 'en' && item.name_en ? item.name_en : 
                      language === 'fr' && item.name_fr ? item.name_fr : 
                      item.name;
                      
  const displayDescription = language === 'en' && item.description_en ? item.description_en : 
                             language === 'fr' && item.description_fr ? item.description_fr : 
                             item.description;

  return (
    <button
      onClick={onAdd}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary hover:shadow-md text-left h-full"
    >
      <div className="relative h-32 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        
        {/* Item Number Badge */}
        {item.number && (
          <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            {item.number}
          </div>
        )}

        <img 
          src={item.image} 
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute bottom-2 left-2 right-2 z-20 flex justify-between items-end">
          <span className="font-bold text-white text-lg drop-shadow-md">{item.price.toFixed(2)}€</span>
          <div className="flex gap-1">
            {item.isVeg && (
              <span className="bg-green-600/90 p-1 rounded-full text-white" title="Vegetariano">
                <Leaf className="w-3 h-3" />
              </span>
            )}
            {item.isSpicy && (
              <span className="bg-red-600/90 p-1 rounded-full text-white" title="Picante">
                <Flame className="w-3 h-3" />
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-3 flex flex-col flex-grow">
        <h4 className="font-heading text-base leading-tight mb-1 group-hover:text-primary transition-colors">
          {displayName}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-auto">
          {displayDescription}
        </p>
      </div>
      
      {/* Ripple effect overlay on click could be added here */}
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}
