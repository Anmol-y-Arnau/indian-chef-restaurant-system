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
import { format, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { History, RotateCcw, Calendar, TrendingUp, CreditCard } from "lucide-react";
import { useState, useMemo } from "react";
import PaymentModal from "./PaymentModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function HistoryDialog() {
  const { orderHistory, restoreOrderToTable, tables, updateSalePaymentMethod } = useRestaurant();
  const [selectedTableForRestore, setSelectedTableForRestore] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showStats, setShowStats] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<number | null>(null);
  const [editingSaleTotal, setEditingSaleTotal] = useState<number>(0);

  // Filter orders by selected date
  const filteredHistory = useMemo(() => {
    if (!selectedDate) return orderHistory;
    
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    
    return orderHistory.filter(item => {
      const itemDate = new Date(item.date);
      return isWithinInterval(itemDate, { start: dayStart, end: dayEnd });
    });
  }, [orderHistory, selectedDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSales = filteredHistory.reduce((sum, item) => sum + item.total, 0);
    const cashSales = filteredHistory
      .filter(item => item.paymentMethod === 'cash' || item.paymentMethod === 'mixed')
      .reduce((sum, item) => {
        if (item.paymentMethod === 'mixed' && item.cashPayers && item.totalPayers) {
          return sum + (item.total * item.cashPayers / item.totalPayers);
        }
        return sum + item.total;
      }, 0);
    
    const cardSales = filteredHistory
      .filter(item => item.paymentMethod === 'card' || item.paymentMethod === 'mixed')
      .reduce((sum, item) => {
        if (item.paymentMethod === 'mixed' && item.cardPayers && item.totalPayers) {
          return sum + (item.total * item.cardPayers / item.totalPayers);
        }
        return sum + item.total;
      }, 0);

    const ticketCount = filteredHistory.length;
    const averageTicket = ticketCount > 0 ? totalSales / ticketCount : 0;

    return {
      totalSales,
      cashSales,
      cardSales,
      ticketCount,
      averageTicket
    };
  }, [filteredHistory]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-primary/50 text-primary hover:bg-primary/10">
          <History className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">Historial de Ventas</DialogTitle>
        </DialogHeader>
        
        {/* Toolbar */}
        <div className="flex gap-2 items-center border-b border-border pb-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="w-4 h-4" />
                {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>

          <Button 
            variant={showStats ? "default" : "outline"} 
            size="sm" 
            className="gap-2"
            onClick={() => setShowStats(!showStats)}
          >
            <TrendingUp className="w-4 h-4" />
            Contabilidad
          </Button>

          {selectedDate && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedDate(new Date())}
            >
              Hoy
            </Button>
          )}
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-card border border-border rounded-lg">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-primary">{stats.totalSales.toFixed(2)}€</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Efectivo</p>
              <p className="text-xl font-bold text-green-500">{stats.cashSales.toFixed(2)}€</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tarjeta</p>
              <p className="text-xl font-bold text-blue-500">{stats.cardSales.toFixed(2)}€</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tickets</p>
              <p className="text-xl font-bold">{stats.ticketCount}</p>
            </div>
            <div className="col-span-2 md:col-span-4 space-y-1 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">Ticket Promedio</p>
              <p className="text-lg font-bold text-primary">{stats.averageTicket.toFixed(2)}€</p>
            </div>
          </div>
        )}
        
        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {selectedDate && format(selectedDate, "dd/MM/yyyy") !== format(new Date(), "dd/MM/yyyy")
                  ? `No hay ventas registradas el ${format(selectedDate, "dd/MM/yyyy", { locale: es })}.`
                  : "No hay ventas registradas hoy."}
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">Mesa {item.tableId}</span>
                      {item.paymentMethod && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          item.paymentMethod === 'cash' && "bg-green-500/20 text-green-500",
                          item.paymentMethod === 'card' && "bg-blue-500/20 text-blue-500",
                          item.paymentMethod === 'mixed' && "bg-purple-500/20 text-purple-500"
                        )}>
                          {item.paymentMethod === 'cash' && '💵 Efectivo'}
                          {item.paymentMethod === 'card' && '💳 Tarjeta'}
                          {item.paymentMethod === 'mixed' && `💵${item.cashPayers} 💳${item.cardPayers}`}
                        </span>
                      )}
                    </div>
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => {
                        setEditingSaleId(Number(item.id));
                        setEditingSaleTotal(item.total);
                      }}
                    >
                      <CreditCard className="w-3 h-3 mr-1" /> Cambiar pago
                    </Button>
                    <Select value={selectedTableForRestore} onValueChange={setSelectedTableForRestore}>
                      <SelectTrigger className="h-8 text-xs w-[100px]">
                        <SelectValue placeholder="Mesa..." />
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
                          const tableId = isNaN(Number(selectedTableForRestore)) ? selectedTableForRestore : Number(selectedTableForRestore);
                          restoreOrderToTable(tableId, item.items);
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
      
      {editingSaleId !== null && (
        <PaymentModal
          isOpen={true}
          onClose={() => {
            setEditingSaleId(null);
            setEditingSaleTotal(0);
          }}
          total={editingSaleTotal}
          onConfirm={async (paymentData) => {
            await updateSalePaymentMethod(editingSaleId, paymentData);
            setEditingSaleId(null);
            setEditingSaleTotal(0);
          }}
        />
      )}
    </Dialog>
  );
}
