import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRestaurant } from "@/contexts/RestaurantContext";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

export default function StatsView() {
  const [, setLocation] = useLocation();
  const { orderHistory } = useRestaurant();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "custom">("week");

  // Calculate date range based on selection
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (timeRange) {
      case "week":
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case "month":
        return {
          start: subDays(now, 30),
          end: now,
        };
      default:
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
    }
  }, [timeRange]);

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    return orderHistory.filter(sale => {
      const saleDate = new Date(sale.date);
      return isWithinInterval(saleDate, { start: dateRange.start, end: dateRange.end });
    });
  }, [orderHistory, dateRange]);

  // Calculate daily sales for chart
  const dailySales = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map(day => {
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));
      
      const daySales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= dayStart && saleDate <= dayEnd;
      });

      const total = daySales.reduce((sum, sale) => sum + sale.total, 0);
      
      return {
        date: format(day, "EEE dd", { locale: es }),
        total,
        count: daySales.length,
      };
    });
  }, [filteredSales, dateRange]);

  // Calculate top selling items
  const topItems = useMemo(() => {
    const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};

    filteredSales.forEach(sale => {
      sale.items.forEach((item: any) => {
        const key = item.menuItem.name;
        if (!itemCounts[key]) {
          itemCounts[key] = {
            name: item.menuItem.name,
            count: 0,
            revenue: 0,
          };
        }
        itemCounts[key].count += item.quantity;
        itemCounts[key].revenue += item.menuItem.price * item.quantity;
      });
    });

    return Object.values(itemCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredSales]);

  // Calculate payment method stats
  const paymentStats = useMemo(() => {
    const cash = filteredSales
      .filter(s => s.paymentMethod === "cash" || s.paymentMethod === "mixed")
      .reduce((sum, s) => {
        if (s.paymentMethod === "mixed" && s.cashPayers && s.totalPayers) {
          return sum + (s.total * s.cashPayers / s.totalPayers);
        }
        return sum + s.total;
      }, 0);

    const card = filteredSales
      .filter(s => s.paymentMethod === "card" || s.paymentMethod === "mixed")
      .reduce((sum, s) => {
        if (s.paymentMethod === "mixed" && s.cardPayers && s.totalPayers) {
          return sum + (s.total * s.cardPayers / s.totalPayers);
        }
        return sum + s.total;
      }, 0);

    const total = cash + card;
    return {
      cash,
      card,
      cashPercent: total > 0 ? (cash / total) * 100 : 0,
      cardPercent: total > 0 ? (card / total) * 100 : 0,
    };
  }, [filteredSales]);

  // Calculate summary stats
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalOrders = filteredSales.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const maxSale = dailySales.reduce((max, day) => day.total > max ? day.total : max, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 border-b border-border p-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-heading bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Estadísticas
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(dateRange.start, "dd MMM", { locale: es })} - {format(dateRange.end, "dd MMM yyyy", { locale: es })}
          </p>
        </div>
        <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6 pb-20">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Ingresos Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalRevenue.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalOrders} pedidos
                </p>
              </CardContent>
            </Card>

            <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-secondary" />
                  Ticket Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">{averageTicket.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Por pedido
                </p>
              </CardContent>
            </Card>

            <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  Día Máximo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{maxSale.toFixed(2)}€</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mejor día del período
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Sales Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Ventas Diarias
              </CardTitle>
              <CardDescription>Evolución de ventas en el período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-2">
                {dailySales.map((day, index) => {
                  const height = maxSale > 0 ? (day.total / maxSale) * 100 : 0;
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-xs font-medium text-primary">
                        {day.total > 0 ? `${day.total.toFixed(0)}€` : ""}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-primary via-secondary to-accent rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${height}%`, minHeight: day.total > 0 ? "4px" : "0" }}
                      />
                      <div className="text-xs text-muted-foreground text-center">
                        {day.date}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-secondary" />
                Platos Más Vendidos
              </CardTitle>
              <CardDescription>Top 10 productos del período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topItems.map((item, index) => {
                  const maxCount = topItems[0]?.count || 1;
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {index + 1}. {item.name}
                        </span>
                        <span className="text-muted-foreground">
                          {item.count} uds · {item.revenue.toFixed(2)}€
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accent" />
                Métodos de Pago
              </CardTitle>
              <CardDescription>Distribución de pagos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Efectivo</span>
                      <span className="text-muted-foreground">{paymentStats.cashPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600"
                        style={{ width: `${paymentStats.cashPercent}%` }}
                      />
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {paymentStats.cash.toFixed(2)}€
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Tarjeta</span>
                      <span className="text-muted-foreground">{paymentStats.cardPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                        style={{ width: `${paymentStats.cardPercent}%` }}
                      />
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {paymentStats.card.toFixed(2)}€
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
