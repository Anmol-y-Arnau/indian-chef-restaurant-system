export interface MenuItem {
  id: string;
  name: string;
  name_en?: string;
  name_fr?: string;
  description: string;
  description_en?: string;
  description_fr?: string;
  price: number;
  category: 'starters' | 'salads' | 'tandoor' | 'veg_curry' | 'chicken_curry' | 'fish_prawn_curry' | 'lamb_curry' | 'biryani' | 'sides' | 'wines' | 'drinks' | 'coffees' | 'desserts';
  image?: string;
  isSpicy?: boolean;
  isVeg?: boolean;
  number?: number;
}

export interface OrderItem {
  id: string | number;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  isDelivered?: boolean | number; // boolean en frontend, 0/1 en DB
  createdAt?: string | Date; // timestamp de creación
}

export interface Table {
  id: number | string;
  name: string;
  status: 'free' | 'occupied' | 'payment_pending';
  orders: OrderItem[];
  guests: number;
  startTime?: Date;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
}

export interface OrderHistoryItem {
  id: string;
  tableId: number | string;
  date: string; // ISO string
  total: number;
  items: OrderItem[];
}
