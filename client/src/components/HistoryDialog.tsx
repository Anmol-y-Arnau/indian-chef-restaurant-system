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
import { History, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function HistoryDialog() {
  const { orderHistory, restoreOrderToTable, tables } = useRestaurant();
  const [selectedTableForRestore, setSelectedTableForRestore] = useState<string>("");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-primary/50 text-primary hover:bg-primary/10">
          <History className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">Historial de Ventas</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 min-h-0 pr-4">
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
                  
                  <div className="pt-2 flex gap-2">
                    <Select value={selectedTableForRestore} onValueChange={setSelectedTableForRestore}>
                      <SelectTrigger className="h-8 text-xs w-[140px]">
                        <SelectValue placeholder="Elegir mesa..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map(t => (
                          <SelectItem key={t.id} value={t.id.toString()}>Mesa {t.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-8 text-xs flex-1"
                      disabled={!selectedTableForRestore}
                      onClick={() => {
                        if (selectedTableForRestore) {
                          // Check if ID is numeric or string (like '0+')
                          const tableId = isNaN(Number(selectedTableForRestore)) ? selectedTableForRestore : Number(selectedTableForRestore);
                          restoreOrderToTable(tableId, item.items);
                          // Close dialog? Maybe not needed, user might want to see confirmation
                        }
                      }}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" /> Recuperar
                    </Button>
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
