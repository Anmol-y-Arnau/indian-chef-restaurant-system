import { CATEGORIES } from './data';
import { OrderItem } from './types';

/**
 * Orden de prioridad de las categorías según el menú
 */
const CATEGORY_ORDER = CATEGORIES.map(cat => cat.id);

/**
 * Obtiene el índice de orden de una categoría
 * @param category - ID de la categoría
 * @returns Índice de orden (menor = primero)
 */
export function getCategoryOrder(category: string): number {
  const index = CATEGORY_ORDER.indexOf(category);
  return index === -1 ? 999 : index; // Si no se encuentra, poner al final
}

/**
 * Ordena un array de pedidos según el orden de las categorías del menú
 * @param orders - Array de pedidos a ordenar
 * @returns Array de pedidos ordenado por categoría
 */
export function sortOrdersByCategory(orders: OrderItem[]): OrderItem[] {
  return [...orders].sort((a, b) => {
    const orderA = getCategoryOrder(a.menuItem.category);
    const orderB = getCategoryOrder(b.menuItem.category);
    
    // Primero ordenar por categoría
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Si son de la misma categoría, mantener el orden original (por ID)
    const idA = typeof a.id === 'string' ? parseInt(a.id) : a.id;
    const idB = typeof b.id === 'string' ? parseInt(b.id) : b.id;
    return idA - idB;
  });
}
