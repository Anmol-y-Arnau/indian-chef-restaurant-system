import { describe, it, expect } from 'vitest';

// Mock data para testing
const mockOrders = [
  {
    id: 1,
    quantity: 1,
    menuItem: {
      id: 'dr1',
      name: 'Agua Grande',
      category: 'drinks',
      price: 2.50
    }
  },
  {
    id: 2,
    quantity: 1,
    menuItem: {
      id: 'st1',
      name: 'Chaat Samosa',
      category: 'starters',
      price: 6.90
    }
  },
  {
    id: 3,
    quantity: 1,
    menuItem: {
      id: 'ds1',
      name: 'Kulfi',
      category: 'desserts',
      price: 4.90
    }
  },
  {
    id: 4,
    quantity: 1,
    menuItem: {
      id: 'cc1',
      name: 'Chicken Curry',
      category: 'chicken_curry',
      price: 12.90
    }
  },
  {
    id: 5,
    quantity: 1,
    menuItem: {
      id: 'sd1',
      name: 'Plain Rice',
      category: 'sides',
      price: 3.90
    }
  }
];

// Importar las funciones de ordenación
import { sortOrdersByCategory, getCategoryOrder } from '../client/src/lib/orderUtils';

describe('Order Sorting by Category', () => {
  it('should return correct category order index', () => {
    expect(getCategoryOrder('starters')).toBe(0);
    expect(getCategoryOrder('salads')).toBe(1);
    expect(getCategoryOrder('tandoor')).toBe(2);
    expect(getCategoryOrder('desserts')).toBe(12);
    expect(getCategoryOrder('unknown')).toBe(999);
  });

  it('should sort orders by category menu order', () => {
    const sorted = sortOrdersByCategory(mockOrders as any);
    
    // Verificar que están ordenados correctamente
    expect(sorted[0].menuItem.category).toBe('starters'); // Entrantes primero
    expect(sorted[1].menuItem.category).toBe('chicken_curry'); // Curry de pollo
    expect(sorted[2].menuItem.category).toBe('sides'); // Guarniciones
    expect(sorted[3].menuItem.category).toBe('drinks'); // Bebidas
    expect(sorted[4].menuItem.category).toBe('desserts'); // Postres al final
  });

  it('should maintain order within same category', () => {
    const sameCategory = [
      {
        id: 3,
        quantity: 1,
        menuItem: { id: 'st3', name: 'Item 3', category: 'starters', price: 5 }
      },
      {
        id: 1,
        quantity: 1,
        menuItem: { id: 'st1', name: 'Item 1', category: 'starters', price: 5 }
      },
      {
        id: 2,
        quantity: 1,
        menuItem: { id: 'st2', name: 'Item 2', category: 'starters', price: 5 }
      }
    ];

    const sorted = sortOrdersByCategory(sameCategory as any);
    
    // Dentro de la misma categoría, mantener orden por ID
    expect(sorted[0].id).toBe(1);
    expect(sorted[1].id).toBe(2);
    expect(sorted[2].id).toBe(3);
  });

  it('should handle empty array', () => {
    const sorted = sortOrdersByCategory([]);
    expect(sorted).toEqual([]);
  });

  it('should not mutate original array', () => {
    const original = [...mockOrders];
    sortOrdersByCategory(mockOrders as any);
    expect(mockOrders).toEqual(original);
  });
});
