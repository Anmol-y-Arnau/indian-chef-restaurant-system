import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { History } from "lucide-react";

export function HistoryDialog() {
  const { orderHistory } = useRestaurant();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-primary/50 text-primary hover:bg-primary/10">
          <History className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">Historial de Ventas</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {orderHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No hay ventas registradas hoy.
              </div>
            ) : (
              orderHistory.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="font-bold text-lg">Mesa {item.tableId}</span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(item.date), "HH:mm", { locale: es })}
                    </span>
                  </div>
                  
                  <div className="space-y-1 py-2">
                    {item.items.map((orderItem, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{orderItem.quantity}x {orderItem.menuItem.name}</span>
                        <span>{(orderItem.menuItem.price * orderItem.quantity).toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-border font-bold text-primary">
                    <span>Total</span>
                    <span>{item.total.toFixed(2)}€</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
