import { trpc } from "@/lib/trpc";
import { INITIAL_TABLES, MENU_ITEMS } from "@/lib/data";
import { MenuItem, OrderHistoryItem, OrderItem, Table } from "@/lib/types";
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

interface RestaurantContextType {
  tables: Table[];
  activeTableId: number | string | null;
  setActiveTableId: (id: number | string | null) => void;
  addOrderToTable: (tableId: number | string, menuItem: MenuItem, customization?: { quantity?: number; spiceLevel?: string; notes?: string }) => void;
  removeOrderFromTable: (tableId: number | string, orderId: string) => void;
  updateTableStatus: (tableId: number | string, status: Table['status']) => void;
  updateTableGuests: (tableId: number | string, guests: number) => void;
  clearTable: (tableId: number | string) => void;
  getTableTotal: (tableId: number | string) => number;
  orderHistory: OrderHistoryItem[];
  closeTable: (tableId: number | string, paymentData?: { method: string; splitBetween: number; cashPayers: number; cardPayers: number }) => void;
  restoreOrderToTable: (tableId: number | string, items: OrderItem[]) => void;
  updateSalePaymentMethod: (saleId: number, paymentData: { method: string; splitBetween: number; cashPayers: number; cardPayers: number }) => Promise<void>;
  deleteSale: (saleId: number) => Promise<void>;
  isLoading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [activeTableId, setActiveTableId] = useState<number | string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // tRPC hooks
  const { data: dbTables, refetch: refetchTables } = trpc.restaurant.getTables.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10 seconds (optimized for RAM)
  });
  const { data: dbOrders, refetch: refetchOrders } = trpc.restaurant.getAllOrders.useQuery(undefined, {
    refetchInterval: 10000, // Poll every 10 seconds (optimized for RAM)
  });
  const { data: dbSales } = trpc.restaurant.getSales.useQuery(undefined, {
    refetchInterval: 15000, // Poll every 15 seconds (optimized for RAM)
  });

  const addOrderMutation = trpc.restaurant.addOrder.useMutation({
    onSuccess: () => {
      refetchTables();
      refetchOrders();
    },
  });

  const deleteOrderMutation = trpc.restaurant.deleteOrder.useMutation({
    onSuccess: () => {
      refetchTables();
      refetchOrders();
    },
  });

  const updateOrderMutation = trpc.restaurant.updateOrderQuantity.useMutation({
    onSuccess: () => {
      refetchOrders();
    },
  });

  const completeTableMutation = trpc.restaurant.completeTable.useMutation({
    onSuccess: () => {
      refetchTables();
      refetchOrders();
    },
  });

  const initializeTablesMutation = trpc.restaurant.initializeTables.useMutation();

  // Initialize tables in database on first load
  useEffect(() => {
    const initTables = async () => {
      const tableIds = INITIAL_TABLES.map(t => String(t.id));
      await initializeTablesMutation.mutateAsync({ tableIds });
      setIsLoading(false);
    };
    initTables();
  }, []);

  // Sync database state with local state
  useEffect(() => {
    if (!dbTables || !dbOrders) return;

    // Build tables with their orders
    const syncedTables: Table[] = INITIAL_TABLES.map(initialTable => {
      const dbTable = dbTables.find(t => t.tableId === String(initialTable.id));
      const tableOrders = dbOrders.filter(order => String(order.tableId) === String(initialTable.id));

      // Convert database orders to OrderItem format
      const orders: OrderItem[] = tableOrders.map(dbOrder => {
        const menuItem = MENU_ITEMS.find(item => item.id === dbOrder.itemId);
        return {
          id: String(dbOrder.id),
          menuItem: menuItem || {
            id: dbOrder.itemId,
            name: dbOrder.itemName,
            price: parseFloat(dbOrder.itemPrice),
            category: 'starters' as const,
            description: '',
            image: '',
          },
          quantity: dbOrder.quantity,
          spiceLevel: dbOrder.spiceLevel || undefined,
          notes: dbOrder.notes || undefined,
          isDelivered: dbOrder.isDelivered,
          createdAt: dbOrder.createdAt,
        };
      });

      return {
        ...initialTable,
        status: orders.length > 0 ? 'occupied' : 'free',
        orders,
        startTime: orders.length > 0 ? new Date() : undefined,
      };
    });

    setTables(syncedTables);
  }, [dbTables, dbOrders]);

  const addOrderToTable = async (tableId: number | string, menuItem: MenuItem, customization?: { quantity?: number; spiceLevel?: string; notes?: string }) => {
    const quantity = customization?.quantity || 1;
    const spiceLevel = customization?.spiceLevel;
    const notes = customization?.notes;
    
    try {
      // Backend now handles the logic of updating existing pending orders vs creating new ones
      await addOrderMutation.mutateAsync({
        tableId: String(tableId),
        itemId: menuItem.id,
        itemName: menuItem.name,
        itemPrice: menuItem.price.toFixed(2),
        quantity,
        spiceLevel,
        notes,
      });
      
      toast.success(`${quantity}x ${menuItem.name} añadido a la Mesa ${tableId}`);
    } catch (error) {
      toast.error('Error al añadir el pedido');
      console.error(error);
    }
  };

  const removeOrderFromTable = async (tableId: number | string, orderId: string) => {
    try {
      const order = dbOrders?.find(o => o.id === parseInt(orderId));
      if (!order) return;

      if (order.quantity > 1) {
        await updateOrderMutation.mutateAsync({
          orderId: parseInt(orderId),
          quantity: order.quantity - 1,
        });
      } else {
        await deleteOrderMutation.mutateAsync({
          orderId: parseInt(orderId),
        });
      }
    } catch (error) {
      toast.error('Error al eliminar el pedido');
      console.error(error);
    }
  };

  const updateTableStatus = (tableId: number | string, status: Table['status']) => {
    // This is handled automatically by the API when orders are added/removed
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, status } : table
    ));
  };

  const updateTableGuests = (tableId: number | string, guests: number) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, guests } : table
    ));
  };

  const clearTable = async (tableId: number | string) => {
    try {
      const tableOrders = dbOrders?.filter(o => o.tableId === String(tableId)) || [];
      for (const order of tableOrders) {
        await deleteOrderMutation.mutateAsync({ orderId: order.id });
      }
      toast.info(`Mesa ${tableId} liberada`);
    } catch (error) {
      toast.error('Error al limpiar la mesa');
      console.error(error);
    }
  };

  const getTableTotal = (tableId: number | string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return 0;
    return table.orders.reduce((total, order) => total + (order.menuItem.price * order.quantity), 0);
  };

  const closeTable = async (tableId: number | string, paymentData?: { method: string; splitBetween: number; cashPayers: number; cardPayers: number }) => {
    try {
      const table = tables.find(t => t.id === tableId);
      if (!table || table.orders.length === 0) return;

      const total = getTableTotal(tableId);
      const items = table.orders.map(order => ({
        id: order.id,
        menuItem: {
          id: order.menuItem.id,
          name: order.menuItem.name,
          price: order.menuItem.price,
          category: order.menuItem.category,
          description: order.menuItem.description || '',
        },
        quantity: order.quantity,
      }));

      await completeTableMutation.mutateAsync({
        tableId: String(tableId),
        items: items as any,
        total: total.toFixed(2),
        paymentMethod: paymentData?.method || 'cash',
        splitBetween: paymentData?.splitBetween,
        cashPayers: paymentData?.cashPayers,
        cardPayers: paymentData?.cardPayers,
      });

      setActiveTableId(null);
      toast.success(`Mesa ${tableId} cerrada correctamente`);
    } catch (error) {
      toast.error('Error al cerrar la mesa');
      console.error(error);
    }
  };

  const restoreOrderToTable = async (tableId: number | string, items: OrderItem[]) => {
    try {
      for (const item of items) {
        await addOrderMutation.mutateAsync({
          tableId: String(tableId),
          itemId: item.menuItem.id,
          itemName: item.menuItem.name,
          itemPrice: item.menuItem.price.toFixed(2),
          quantity: item.quantity,
        });
      }
      setActiveTableId(tableId);
      toast.success(`Pedido recuperado en Mesa ${tableId}`);
    } catch (error) {
      toast.error('Error al recuperar el pedido');
      console.error(error);
    }
  };

  const updateSalePaymentMutation = trpc.restaurant.updateSalePaymentMethod.useMutation();

  const updateSalePaymentMethod = async (saleId: number, paymentData: { method: string; splitBetween: number; cashPayers: number; cardPayers: number }) => {
    try {
      await updateSalePaymentMutation.mutateAsync({
        saleId,
        paymentMethod: paymentData.method,
        splitBetween: paymentData.splitBetween,
        cashPayers: paymentData.cashPayers,
        cardPayers: paymentData.cardPayers,
      });
      toast.success('Método de pago actualizado');
    } catch (error) {
      toast.error('Error al actualizar el método de pago');
      console.error(error);
    }
  };

  const deleteSaleMutation = trpc.restaurant.deleteSale.useMutation();

  const deleteSale = async (saleId: number) => {
    try {
      await deleteSaleMutation.mutateAsync({ saleId });
      toast.success('Venta eliminada correctamente');
    } catch (error) {
      toast.error('Error al eliminar la venta');
      console.error(error);
    }
  };

  // Convert database sales to order history format
  const orderHistory: OrderHistoryItem[] = (dbSales || []).map(sale => ({
    id: String(sale.id),
    tableId: sale.tableId,
    // Use serviceDate (first order) if available, fallback to createdAt for old sales
    // Keep as Date object to avoid timezone conversion issues
    date: new Date(sale.serviceDate || sale.createdAt),
    total: parseFloat(sale.total),
    items: sale.items as any, // JSON field from database
    paymentMethod: sale.paymentMethod as 'cash' | 'card' | 'mixed' | undefined,
    totalPayers: sale.splitBetween || undefined,
    cashPayers: sale.cashPayers || undefined,
    cardPayers: sale.cardPayers || undefined,
  }));

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    tables,
    activeTableId,
    setActiveTableId,
    addOrderToTable,
    removeOrderFromTable,
    updateTableStatus,
    updateTableGuests,
    clearTable,
    getTableTotal,
    orderHistory,
    closeTable,
    restoreOrderToTable,
    updateSalePaymentMethod,
    deleteSale,
    isLoading,
  }), [tables, activeTableId, orderHistory, isLoading]);

  return (
    <RestaurantContext.Provider value={contextValue}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
