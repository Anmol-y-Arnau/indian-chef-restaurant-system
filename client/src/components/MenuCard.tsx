import { MenuItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Flame, Leaf } from "lucide-react";

interface MenuCardProps {
  item: MenuItem;
  onAdd: () => void;
}

export function MenuCard({ item, onAdd }: MenuCardProps) {
  return (
    <button
      onClick={onAdd}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary hover:shadow-md text-left h-full"
    >
      <div className="relative h-32 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
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
          {item.name}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-auto">
          {item.description}
        </p>
      </div>
      
      {/* Ripple effect overlay on click could be added here */}
      <div className="absolute inset-0 bg-primary/10 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}
