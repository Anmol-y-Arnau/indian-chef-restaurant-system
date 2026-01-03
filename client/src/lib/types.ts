export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'starters' | 'salads' | 'tandoor' | 'veg_curry' | 'chicken_curry' | 'biryani' | 'sides' | 'wines' | 'drinks' | 'coffees';
  image?: string;
  isSpicy?: boolean;
  isVeg?: boolean;
}

export interface OrderItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface Table {
  id: number;
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
