import { INITIAL_TABLES, MENU_ITEMS } from "@/lib/data";
import { MenuItem, OrderItem, Table } from "@/lib/types";
import React, { createContext, useContext, useState } from "react";
import { toast } from "sonner";

interface RestaurantContextType {
  tables: Table[];
  activeTableId: number | null;
  setActiveTableId: (id: number | null) => void;
  addOrderToTable: (tableId: number, menuItem: MenuItem) => void;
  removeOrderFromTable: (tableId: number, orderId: string) => void;
  updateTableStatus: (tableId: number, status: Table['status']) => void;
  updateTableGuests: (tableId: number, guests: number) => void;
  clearTable: (tableId: number) => void;
  getTableTotal: (tableId: number) => number;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [activeTableId, setActiveTableId] = useState<number | null>(null);

  const addOrderToTable = (tableId: number, menuItem: MenuItem) => {
    setTables(prev => prev.map(table => {
      if (table.id === tableId) {
        const newOrder: OrderItem = {
          id: Math.random().toString(36).substr(2, 9),
          menuItem,
          quantity: 1
        };
        
        // Check if item already exists to increment quantity instead?
        // For this design, let's keep them as separate lines for easier modification/notes later
        // or we can group them. Let's group them for cleaner ticket.
        
        const existingOrderIndex = table.orders.findIndex(o => o.menuItem.id === menuItem.id);
        
        let updatedOrders = [...table.orders];
        if (existingOrderIndex >= 0) {
          updatedOrders[existingOrderIndex] = {
            ...updatedOrders[existingOrderIndex],
            quantity: updatedOrders[existingOrderIndex].quantity + 1
          };
        } else {
          updatedOrders.push(newOrder);
        }

        // Auto-set status to occupied if it was free
        const newStatus = table.status === 'free' ? 'occupied' : table.status;
        const newStartTime = table.status === 'free' ? new Date() : table.startTime;

        return { 
          ...table, 
          orders: updatedOrders,
          status: newStatus,
          startTime: newStartTime
        };
      }
      return table;
    }));
    toast.success(`${menuItem.name} añadido a la Mesa ${tableId}`);
  };

  const removeOrderFromTable = (tableId: number, orderId: string) => {
    setTables(prev => prev.map(table => {
      if (table.id === tableId) {
        const order = table.orders.find(o => o.id === orderId);
        if (order && order.quantity > 1) {
           return {
             ...table,
             orders: table.orders.map(o => o.id === orderId ? {...o, quantity: o.quantity - 1} : o)
           };
        }
        return {
          ...table,
          orders: table.orders.filter(o => o.id !== orderId)
        };
      }
      return table;
    }));
  };

  const updateTableStatus = (tableId: number, status: Table['status']) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, status } : table
    ));
  };

  const updateTableGuests = (tableId: number, guests: number) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, guests } : table
    ));
  };

  const clearTable = (tableId: number) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { 
        ...table, 
        status: 'free', 
        orders: [], 
        guests: 0,
        startTime: undefined 
      } : table
    ));
    toast.info(`Mesa ${tableId} liberada`);
  };

  const getTableTotal = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return 0;
    return table.orders.reduce((total, order) => total + (order.menuItem.price * order.quantity), 0);
  };

  return (
    <RestaurantContext.Provider value={{
      tables,
      activeTableId,
      setActiveTableId,
      addOrderToTable,
      removeOrderFromTable,
      updateTableStatus,
      updateTableGuests,
      clearTable,
      getTableTotal
    }}>
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
